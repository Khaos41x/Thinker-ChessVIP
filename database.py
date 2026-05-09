"""
Thinker Chess VIP - Sistema de Banco de Dados
=====================================
Gerencia licenças e usuários com SQLite.

Tabelas:
- licenses: Licenças geradas pelo vendedor
- users: Usuários registrados com suas credenciais
"""

import sqlite3
import uuid
import datetime
import hashlib
import os
import re

DB_NAME = "users.db"


def get_db_connection():
    """Cria conexão com o banco de dados SQLite."""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Inicializa o banco de dados com as tabelas necessárias."""
    conn = get_db_connection()
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS licenses (
            key TEXT PRIMARY KEY,
            owner_name TEXT NOT NULL,
            contact_info TEXT,
            notes TEXT,
            created_at TEXT NOT NULL,
            last_login TEXT,
            is_active INTEGER DEFAULT 1,
            is_used INTEGER DEFAULT 0,
            used_by_username TEXT
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            license_key TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL,
            last_login TEXT,
            login_count INTEGER DEFAULT 0,
            FOREIGN KEY (license_key) REFERENCES licenses(key)
        )
    ''')
    
    try:
        conn.execute('ALTER TABLE licenses ADD COLUMN is_used INTEGER DEFAULT 0')
    except:
        pass
    
    try:
        conn.execute('ALTER TABLE licenses ADD COLUMN used_by_username TEXT')
    except:
        pass
    
    try:
        conn.execute('ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0')
    except:
        pass
    
    try:
        conn.execute('CREATE INDEX IF NOT EXISTS idx_licenses_active ON licenses(is_active)')
    except:
        pass
    
    try:
        conn.execute('CREATE INDEX IF NOT EXISTS idx_licenses_used ON licenses(is_used)')
    except:
        pass
    
    try:
        conn.execute('CREATE INDEX IF NOT EXISTS idx_users_license ON users(license_key)')
    except:
        pass
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS players (
            username TEXT PRIMARY KEY,
            rating INTEGER DEFAULT 1200,
            games_played INTEGER DEFAULT 0,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0,
            draws INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_white TEXT NOT NULL,
            player_black TEXT NOT NULL,
            result TEXT NOT NULL,
            player_white_rating_before INTEGER NOT NULL,
            player_black_rating_before INTEGER NOT NULL,
            player_white_rating_after INTEGER NOT NULL,
            player_black_rating_after INTEGER NOT NULL,
            played_at TEXT NOT NULL,
            FOREIGN KEY (player_white) REFERENCES players(username),
            FOREIGN KEY (player_black) REFERENCES players(username)
        )
    ''')
    
    try:
        conn.execute('CREATE INDEX IF NOT EXISTS idx_matches_white ON matches(player_white)')
    except:
        pass
    
    try:
        conn.execute('CREATE INDEX IF NOT EXISTS idx_matches_black ON matches(player_black)')
    except:
        pass
    
    try:
        conn.execute('CREATE INDEX IF NOT EXISTS idx_matches_played_at ON matches(played_at)')
    except:
        pass
    
    try:
        conn.execute('CREATE INDEX IF NOT EXISTS idx_players_rating ON players(rating)')
    except:
        pass
    
    conn.commit()
    conn.close()


# =============================================================================
# FUNÇÕES DE LICENÇA
# =============================================================================

def create_license(name, contact, notes=""):
    """Cria nova licença para venda."""
    key = str(uuid.uuid4()).upper()
    now = datetime.datetime.now().isoformat()
    conn = get_db_connection()
    try:
        conn.execute('''
            INSERT INTO licenses (key, owner_name, contact_info, notes, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (key, name, contact, notes, now))
        conn.commit()
        return key
    except Exception as e:
        print(f"[DB ERROR] create_license: {e}")
        return None
    finally:
        conn.close()


def get_license(key):
    """Busca licença por chave."""
    conn = get_db_connection()
    try:
        return conn.execute('SELECT * FROM licenses WHERE key = ?', (key.strip(),)).fetchone()
    finally:
        conn.close()


def get_all_licenses():
    """Retorna todas as licenças."""
    conn = get_db_connection()
    try:
        return conn.execute('''
            SELECT l.*, u.username as registered_username
            FROM licenses l
            LEFT JOIN users u ON l.key = u.license_key
            ORDER BY l.created_at DESC
        ''').fetchall()
    finally:
        conn.close()


def search_license(query):
    """Busca licenças por nome, contato ou key."""
    conn = get_db_connection()
    try:
        param = f'%{query}%'
        return conn.execute('''
            SELECT * FROM licenses 
            WHERE owner_name LIKE ? OR contact_info LIKE ? OR key LIKE ?
        ''', (param, param, param)).fetchall()
    finally:
        conn.close()


def revoke_license(key):
    """Revoga uma licença."""
    conn = get_db_connection()
    try:
        result = conn.execute('UPDATE licenses SET is_active = 0 WHERE key = ?', (key,))
        conn.commit()
        return result.rowcount > 0
    finally:
        conn.close()


def reactivate_license(key):
    """Reativa uma licença."""
    conn = get_db_connection()
    try:
        result = conn.execute('UPDATE licenses SET is_active = 1 WHERE key = ?', (key,))
        conn.commit()
        return result.rowcount > 0
    finally:
        conn.close()


def delete_license(key):
    """Deleta uma licença e seu usuário."""
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM users WHERE license_key = ?', (key,))
        conn.execute('DELETE FROM licenses WHERE key = ?', (key,))
        conn.commit()
        return True
    except Exception as e:
        print(f"[DB ERROR] delete_license: {e}")
        return False
    finally:
        conn.close()


def update_last_login(license_key):
    """Atualiza último login."""
    conn = get_db_connection()
    try:
        now = datetime.datetime.now().isoformat()
        conn.execute('UPDATE licenses SET last_login = ? WHERE key = ?', (now, license_key))
        conn.commit()
    finally:
        conn.close()


# =============================================================================
# FUNÇÕES DE USUÁRIO
# =============================================================================

def _hash_password(password, salt=None):
    """Hash de senha usando SHA-256 com salt."""
    if salt is None:
        salt = os.urandom(32).hex()
    
    combined = f"{password}{salt}".encode('utf-8')
    hashed = hashlib.sha256(combined).hexdigest()
    
    return f"{hashed}:{salt}"


def _verify_password(password, stored_hash):
    """Verifica se a senha corresponde ao hash armazenado."""
    try:
        hash_part, salt = stored_hash.split(':')
        new_hash = _hash_password(password, salt)
        return new_hash == stored_hash
    except Exception:
        return False


def _validate_username(username):
    """Valida formato do username."""
    if not username or len(username) < 3 or len(username) > 20:
        return False, "Username deve ter entre 3 e 20 caracteres."
    
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return False, "Username deve conter apenas letras, números e underscore."
    
    return True, ""


def register_user(username, password, license_key):
    """Registra novo usuário."""
    username = username.strip().lower()
    license_key = license_key.strip().upper()
    
    valid, msg = _validate_username(username)
    if not valid:
        return False, msg
    
    if not password or len(password) < 6:
        return False, "Senha deve ter pelo menos 6 caracteres."
    
    conn = get_db_connection()
    try:
        lic = conn.execute('SELECT * FROM licenses WHERE key = ?', (license_key,)).fetchone()
        
        if not lic:
            return False, "Licença não encontrada."
        
        if not lic['is_active']:
            return False, "Licença bloqueada/revogada."
        
        if lic['is_used']:
            return False, "Licença já foi utilizada por outro usuário."
        
        existing = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        if existing:
            return False, "Nome de usuário já existe."
        
        password_hash = _hash_password(password)
        now = datetime.datetime.now().isoformat()
        
        conn.execute('''
            INSERT INTO users (username, password_hash, license_key, created_at, last_login, login_count)
            VALUES (?, ?, ?, ?, ?, 1)
        ''', (username, password_hash, license_key, now, now))
        
        conn.execute('''
            UPDATE licenses SET is_used = 1, used_by_username = ?, last_login = ?
            WHERE key = ?
        ''', (username, now, license_key))
        
        conn.commit()
        return True, "Usuário registrado com sucesso!"
    
    except sqlite3.IntegrityError as e:
        if "UNIQUE constraint" in str(e):
            return False, "Licença já está vinculada a outro usuário."
        return False, f"Erro de integridade: {e}"
    except Exception as e:
        print(f"[DB ERROR] register_user: {e}")
        return False, "Erro no banco de dados."
    finally:
        conn.close()


def authenticate_user(username, password):
    """Autentica usuário."""
    username = username.strip().lower()
    
    conn = get_db_connection()
    try:
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        
        if not user:
            return False, "Usuário não encontrado."
        
        if not _verify_password(password, user['password_hash']):
            return False, "Senha incorreta."
        
        lic = conn.execute('SELECT * FROM licenses WHERE key = ?', (user['license_key'],)).fetchone()
        
        if not lic:
            return False, "Licença não encontrada no sistema."
        
        if not lic['is_active']:
            return False, "Sua licença foi revogada. Contate o suporte."
        
        now = datetime.datetime.now().isoformat()
        new_count = (user['login_count'] or 0) + 1
        
        conn.execute(
            'UPDATE users SET last_login = ?, login_count = ? WHERE username = ?', 
            (now, new_count, username)
        )
        conn.execute(
            'UPDATE licenses SET last_login = ? WHERE key = ?', 
            (now, user['license_key']))
        conn.commit()
        
        return True, {
            'username': user['username'],
            'license_key': user['license_key'],
            'login_count': new_count
        }
    
    except Exception as e:
        print(f"[DB ERROR] authenticate_user: {e}")
        return False, "Erro no banco de dados."
    finally:
        conn.close()


def get_user_by_license(license_key):
    """Busca usuário pela license key."""
    conn = get_db_connection()
    try:
        return conn.execute('SELECT * FROM users WHERE license_key = ?', (license_key.strip().upper(),)).fetchone()
    finally:
        conn.close()


def is_license_valid(license_key):
    """Verifica rapidamente se uma licença é válida."""
    conn = get_db_connection()
    try:
        row = conn.execute('SELECT is_active FROM licenses WHERE key = ?', (license_key,)).fetchone()
        return row is not None and row['is_active'] == 1
    finally:
        conn.close()


# =============================================================================
# FUNÇÕES DE PLAYER / RATING
# =============================================================================

def get_or_create_player(username):
    """Busca jogador; se não existir, cria com rating 1200."""
    username = username.strip().lower()
    conn = get_db_connection()
    try:
        player = conn.execute('SELECT * FROM players WHERE username = ?', (username,)).fetchone()
        if player:
            return dict(player)
        now = datetime.datetime.now().isoformat()
        conn.execute('''
            INSERT INTO players (username, rating, games_played, wins, losses, draws, created_at, updated_at)
            VALUES (?, 1200, 0, 0, 0, 0, ?, ?)
        ''', (username, now, now))
        conn.commit()
        return conn.execute('SELECT * FROM players WHERE username = ?', (username,)).fetchone()
    except Exception as e:
        print(f"[DB ERROR] get_or_create_player: {e}")
        return None
    finally:
        conn.close()


def get_player(username):
    """Busca jogador pelo username."""
    username = username.strip().lower()
    conn = get_db_connection()
    try:
        row = conn.execute('SELECT * FROM players WHERE username = ?', (username,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def update_player_rating(username, new_rating, games_played, wins, losses, draws):
    """Atualiza rating e estatísticas do jogador."""
    username = username.strip().lower()
    conn = get_db_connection()
    try:
        now = datetime.datetime.now().isoformat()
        conn.execute('''
            UPDATE players
            SET rating = ?, games_played = ?, wins = ?, losses = ?, draws = ?, updated_at = ?
            WHERE username = ?
        ''', (new_rating, games_played, wins, losses, draws, now, username))
        conn.commit()
        return True
    except Exception as e:
        print(f"[DB ERROR] update_player_rating: {e}")
        return False
    finally:
        conn.close()


def record_match(player_white, player_black, result,
                 white_rating_before, black_rating_before,
                 white_rating_after, black_rating_after):
    """Registra uma partida no histórico."""
    player_white = player_white.strip().lower()
    player_black = player_black.strip().lower()
    conn = get_db_connection()
    try:
        now = datetime.datetime.now().isoformat()
        conn.execute('''
            INSERT INTO matches (player_white, player_black, result,
                                 player_white_rating_before, player_black_rating_before,
                                 player_white_rating_after, player_black_rating_after, played_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (player_white, player_black, result,
              white_rating_before, black_rating_before,
              white_rating_after, black_rating_after, now))
        conn.commit()
        return True
    except Exception as e:
        print(f"[DB ERROR] record_match: {e}")
        return False
    finally:
        conn.close()


def get_match_history(username, limit=50):
    """Retorna histórico de partidas de um jogador."""
    username = username.strip().lower()
    conn = get_db_connection()
    try:
        return conn.execute('''
            SELECT * FROM matches
            WHERE player_white = ? OR player_black = ?
            ORDER BY played_at DESC
            LIMIT ?
        ''', (username, username, limit)).fetchall()
    finally:
        conn.close()


def get_last_n_results(username, n=10):
    """Retorna os últimos n resultados do jogador como lista de strings: 'W', 'L', 'D'."""
    username = username.strip().lower()
    conn = get_db_connection()
    try:
        rows = conn.execute('''
            SELECT player_white, result FROM matches
            WHERE player_white = ? OR player_black = ?
            ORDER BY played_at DESC
            LIMIT ?
        ''', (username, username, n)).fetchall()

        results = []
        for row in rows:
            if row['player_white'] == username:
                if row['result'] == 'white_win':
                    results.append('W')
                elif row['result'] == 'black_win':
                    results.append('L')
                else:
                    results.append('D')
            else:
                if row['result'] == 'black_win':
                    results.append('W')
                elif row['result'] == 'white_win':
                    results.append('L')
                else:
                    results.append('D')
        return results
    finally:
        conn.close()


def get_all_players(order_by='rating'):
    """Retorna todos os jogadores ordenados por rating."""
    conn = get_db_connection()
    try:
        col = 'rating DESC' if order_by == 'rating' else 'games_played DESC'
        return conn.execute(f'SELECT * FROM players ORDER BY {col}').fetchall()
    finally:
        conn.close()


init_db()