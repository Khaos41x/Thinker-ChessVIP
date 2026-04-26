# -*- coding: utf-8 -*-
"""
Thinker Chess VIP - Painel Admin
==========================
CLI para gerenciar licenças do Thinker Chess VIP.

Comandos:
    python admin.py criar <nome> <contato> [obs]  -> Gera nova licença
    python admin.py buscar <termo>                 -> Busca por nome/contato/key
    python admin.py listar                         -> Lista todas as licenças
    python admin.py info <key>                     -> Detalhes de uma licença
    python admin.py revogar <key>                  -> Bloqueia uma licença
    python admin.py reativar <key>                 -> Reativa licença bloqueada
    python admin.py deletar <key>                  -> Deleta licença permanentemente
"""

import sys
from database import (
    create_license, 
    search_license, 
    get_license,
    get_all_licenses,
    revoke_license, 
    reactivate_license,
    get_user_by_license,
    delete_license
)


class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    RESET = '\033[0m'


def print_help():
    print(f"""
{Colors.HEADER}{Colors.BOLD}========================================
        THINKER CHESS VIP - PAINEL ADMIN
========================================{Colors.RESET}

{Colors.CYAN}Comandos disponíveis:{Colors.RESET}

  {Colors.GREEN}python admin.py criar <nome> <contato> [obs]{Colors.RESET}
      Gera nova licença para venda.
      Exemplo: python admin.py criar "João Silva" "+55 11 99999-9999"

  {Colors.GREEN}python admin.py buscar <termo>{Colors.RESET}
      Busca licenças por nome, contato ou key.
      Exemplo: python admin.py buscar "João"

  {Colors.GREEN}python admin.py listar{Colors.RESET}
      Lista todas as licenças com status detalhado.

  {Colors.GREEN}python admin.py info <key>{Colors.RESET}
      Mostra detalhes completos de uma licença.
      Exemplo: python admin.py info "ABC123..."

  {Colors.GREEN}python admin.py revogar <key>{Colors.RESET}
      Bloqueia uma licença (usuári será desconectado).

  {Colors.GREEN}python admin.py reativar <key>{Colors.RESET}
      Reativa uma licença bloqueada.

  {Colors.GREEN}python admin.py deletar <key>{Colors.RESET}
      Deleta permanentemente uma licença (IRREVERSÍVEL!).
""")


def get_status_badge(license_row):
    """Retorna badge de status formatado."""
    if not license_row['is_active']:
        return f"{Colors.RED}BANIDO{Colors.RESET}"
    elif license_row['is_used']:
        return f"{Colors.CYAN}EM USO{Colors.RESET}"
    else:
        return f"{Colors.GREEN}DISPONÍVEL{Colors.RESET}"


def format_date(iso_string):
    """Formata data ISO para exibição."""
    if not iso_string:
        return "Nunca"
    try:
        from datetime import datetime
        dt = datetime.fromisoformat(iso_string)
        return dt.strftime("%d/%m/%Y %H:%M")
    except:
        return iso_string


def cmd_criar(args):
    """Cria nova licença."""
    if len(args) < 2:
        print("Uso: python admin.py criar <nome> <contato> [obs]")
        return
    
    name = args[0]
    contact = args[1]
    notes = args[2] if len(args) > 2 else ""
    
    key = create_license(name, contact, notes)
    if key:
        print(f"{Colors.GREEN}Licença criada com sucesso!{Colors.RESET}")
        print(f"  Key: {key}")
        print(f"  Cliente: {name}")
        print(f"  Contato: {contact}")
        if notes:
            print(f"  Obs: {notes}")
    else:
        print(f"{Colors.RED}Erro ao criar licença{Colors.RESET}")


def cmd_buscar(args):
    """Busca licenças."""
    if len(args) < 1:
        print("Uso: python admin.py buscar <termo>")
        return
    
    query = args[0]
    results = search_license(query)
    
    if not results:
        print(f"Nenhuma licença encontrada para: {query}")
        return
    
    print(f"{Colors.CYAN}Resultados da busca: {len(results)}{Colors.RESET}")
    for lic in results:
        print(f"\n  Key: {lic['key']}")
        print(f"  Cliente: {lic['owner_name']}")
        print(f"  Contato: {lic['contact_info'] or 'N/A'}")
        print(f"  Status: {get_status_badge(lic)}")


def cmd_listar(args):
    """Lista todas as licenças."""
    licenses = get_all_licenses()
    
    if not licenses:
        print("Nenhuma licença encontrada.")
        return
    
    print(f"{Colors.CYAN}Total de licenças: {len(licenses)}{Colors.RESET}\n")
    
    for lic in licenses:
        status = get_status_badge(lic)
        print(f"Key: {lic['key']}")
        print(f"  Cliente: {lic['owner_name']}")
        print(f"  Contato: {lic['contact_info'] or 'N/A'}")
        print(f"  Status: {status}")
        print(f"  Criado: {format_date(lic['created_at'])}")
        print(f"  Último login: {format_date(lic['last_login'])}")
        if lic.get('registered_username'):
            print(f"  Usuário: {lic['registered_username']}")
        print()


def cmd_info(args):
    """Mostra detalhes de uma licença."""
    if len(args) < 1:
        print("Uso: python admin.py info <key>")
        return
    
    key = args[0]
    lic = get_license(key)
    
    if not lic:
        print(f"Licença não encontrada: {key}")
        return
    
    print(f"{Colors.CYAN}Detalhes da licença{Colors.RESET}")
    print(f"  Key: {lic['key']}")
    print(f"  Cliente: {lic['owner_name']}")
    print(f"  Contato: {lic['contact_info'] or 'N/A'}")
    print(f"  Notas: {lic['notes'] or 'N/A'}")
    print(f"  Status: {get_status_badge(lic)}")
    print(f"  Criado em: {format_date(lic['created_at'])}")
    print(f"  Último login: {format_date(lic['last_login'])}")
    
    user = get_user_by_license(key)
    if user:
        print(f"\n{Colors.YELLOW}Usuário registrado:{Colors.RESET}")
        print(f"  Username: {user['username']}")
        print(f"  Logins: {user['login_count']}")


def cmd_revogar(args):
    """Revoga uma licença."""
    if len(args) < 1:
        print("Uso: python admin.py revogar <key>")
        return
    
    key = args[0]
    if revoke_license(key):
        print(f"{Colors.RED}Licença bloqueada: {key}{Colors.RESET}")
    else:
        print(f"{Colors.RED}Erro ao bloquear{Colors.RESET}")


def cmd_reativar(args):
    """Reativa uma licença."""
    if len(args) < 1:
        print("Uso: python admin.py reativar <key>")
        return
    
    key = args[0]
    if reactivate_license(key):
        print(f"{Colors.GREEN}Licença reativada: {key}{Colors.RESET}")
    else:
        print(f"{Colors.RED}Erro ao reativar{Colors.RESET}")


def cmd_deletar(args):
    """Deleta uma licença."""
    if len(args) < 1:
        print("Uso: python admin.py deletar <key>")
        return
    
    key = args[0]
    confirma = input(f"Confirma exclusão de {key}? (digite 'sim'): ")
    
    if confirma.lower() == 'sim':
        if delete_license(key):
            print(f"{Colors.RED}Licença deletada: {key}{Colors.RESET}")
        else:
            print(f"{Colors.RED}Erro ao deletar{Colors.RESET}")
    else:
        print("Cancelado.")


def main():
    if len(sys.argv) < 2:
        print_help()
        return
    
    cmd = sys.argv[1].lower()
    args = sys.argv[2:]
    
    comandos = {
        'criar': cmd_criar,
        'buscar': cmd_buscar,
        'listar': cmd_listar,
        'info': cmd_info,
        'revogar': cmd_revogar,
        'reativar': cmd_reativar,
        'deletar': cmd_deletar,
        '--help': print_help,
        '-h': print_help,
    }
    
    func = comandos.get(cmd)
    if func:
        func(args)
    else:
        print(f"Comando desconhecido: {cmd}")
        print_help()


if __name__ == "__main__":
    main()