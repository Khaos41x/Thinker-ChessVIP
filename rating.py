"""
Thinker Chess VIP - Sistema de Rating Auto Adjust
=================================================
Sistema ELO com ajuste automático baseado em desempenho recente.

Regras:
- Rating inicial: 1200
- Rating mínimo: 100
- Máximo de mudança por partida: 50 pontos
- Primeiras 10 partidas: ELO padrão sem auto-adjust
- Auto-adjust baseado nas últimas 10 partidas:
    80-100% vitórias → sobe muito agressivamente
    60-79% vitórias  → sobe agressivamente
    40-59% vitórias  → ajuste normal ELO
    20-39% vitórias  → desce menos (proteção)
    0-19% vitórias   → desce suavemente
"""

import math
import database

K_BASE = 32
MIN_RATING = 100
MAX_RATING_CHANGE = 50
PROVISIONAL_GAMES = 10


def expected_score(rating_a, rating_b):
    """Calcula o score esperado para o jogador A contra B."""
    return 1.0 / (1.0 + math.pow(10, (rating_b - rating_a) / 400.0))


def calculate_elo_change(winner_rating, loser_rating, is_win=True):
    """Calcula mudança ELO base entre dois jogadores."""
    expected = expected_score(winner_rating, loser_rating)

    if is_win:
        actual = 1.0
    else:
        actual = 0.0

    change = K_BASE * (actual - expected)
    return change


def calculate_draw_change(player_rating, opponent_rating):
    """Calcula mudança ELO para empate."""
    expected = expected_score(player_rating, opponent_rating)
    actual = 0.5
    change = K_BASE * (actual - expected)
    return change


def get_performance_multiplier(last_results):
    """
    Calcula multiplicador baseado nas últimas 10 partidas.
    Retorna (multiplier_wins, multiplier_losses) que ajustam quanto sobe/desce.
    """
    if len(last_results) < PROVISIONAL_GAMES:
        return None, None

    total = len(last_results)
    wins = last_results.count('W')
    losses = last_results.count('L')
    win_rate = wins / total

    if win_rate >= 0.80:
        return 1.8, 0.5
    elif win_rate >= 0.60:
        return 1.5, 0.6
    elif win_rate >= 0.40:
        return 1.0, 1.0
    elif win_rate >= 0.20:
        return 0.7, 1.3
    else:
        return 0.5, 1.5


def clamp_change(change):
    """Limita a mudança de rating a no máximo 50 pontos."""
    if change > MAX_RATING_CHANGE:
        return MAX_RATING_CHANGE
    elif change < -MAX_RATING_CHANGE:
        return -MAX_RATING_CHANGE
    return change


def apply_rating_change(current_rating, change):
    """Aplica mudança respeitando o rating mínimo."""
    new_rating = current_rating + change
    if new_rating < MIN_RATING:
        new_rating = MIN_RATING
    return round(new_rating)


def calculate_ratings(white_username, black_username, result):
    """
    Calcula novos ratings após uma partida.

    Args:
        white_username: username das brancas
        black_username: username das pretas
        result: 'white_win', 'black_win', ou 'draw'

    Returns:
        dict com ratings antes/depois e estatísticas atualizadas
    """
    white = database.get_or_create_player(white_username)
    black = database.get_or_create_player(black_username)

    white_rating_before = white['rating']
    black_rating_before = black['rating']
    white_games = white['games_played']
    black_games = black['games_played']

    white_last = database.get_last_n_results(white_username)
    black_last = database.get_last_n_results(black_username)

    is_provisional_white = white_games < PROVISIONAL_GAMES
    is_provisional_black = black_games < PROVISIONAL_GAMES

    if result == 'white_win':
        white_change = calculate_elo_change(white_rating_before, black_rating_before, is_win=True)
        black_change = calculate_elo_change(black_rating_before, white_rating_before, is_win=False)

        if not is_provisional_white:
            mult_w, _ = get_performance_multiplier(white_last)
            if mult_w is not None and mult_w != 1.0:
                white_change *= mult_w

        if not is_provisional_black:
            _, mult_l = get_performance_multiplier(black_last)
            if mult_l is not None and mult_l != 1.0:
                black_change *= mult_l

    elif result == 'black_win':
        black_change = calculate_elo_change(black_rating_before, white_rating_before, is_win=True)
        white_change = calculate_elo_change(white_rating_before, black_rating_before, is_win=False)

        if not is_provisional_black:
            mult_w, _ = get_performance_multiplier(black_last)
            if mult_w is not None and mult_w != 1.0:
                black_change *= mult_w

        if not is_provisional_white:
            _, mult_l = get_performance_multiplier(white_last)
            if mult_l is not None and mult_l != 1.0:
                white_change *= mult_l

    else:
        white_change = calculate_draw_change(white_rating_before, black_rating_before)
        black_change = calculate_draw_change(black_rating_before, white_rating_before)

    white_change = clamp_change(white_change)
    black_change = clamp_change(black_change)

    white_rating_after = apply_rating_change(white_rating_before, white_change)
    black_rating_after = apply_rating_change(black_rating_before, black_change)

    new_white_wins = white['wins'] + (1 if result == 'white_win' else 0)
    new_white_losses = white['losses'] + (1 if result == 'black_win' else 0)
    new_white_draws = white['draws'] + (1 if result == 'draw' else 0)

    new_black_wins = black['wins'] + (1 if result == 'black_win' else 0)
    new_black_losses = black['losses'] + (1 if result == 'white_win' else 0)
    new_black_draws = black['draws'] + (1 if result == 'draw' else 0)

    database.update_player_rating(
        white_username, white_rating_after,
        white_games + 1, new_white_wins, new_white_losses, new_white_draws
    )
    database.update_player_rating(
        black_username, black_rating_after,
        black_games + 1, new_black_wins, new_black_losses, new_black_draws
    )

    database.record_match(
        white_username, black_username, result,
        white_rating_before, black_rating_before,
        white_rating_after, black_rating_after
    )

    return {
        'white': {
            'username': white_username,
            'rating_before': white_rating_before,
            'rating_after': white_rating_after,
            'change': round(white_change),
            'games_played': white_games + 1,
            'wins': new_white_wins,
            'losses': new_white_losses,
            'draws': new_white_draws,
            'is_provisional': is_provisional_white,
        },
        'black': {
            'username': black_username,
            'rating_before': black_rating_before,
            'rating_after': black_rating_after,
            'change': round(black_change),
            'games_played': black_games + 1,
            'wins': new_black_wins,
            'losses': new_black_losses,
            'draws': new_black_draws,
            'is_provisional': is_provisional_black,
        }
    }


def get_rating_summary(username):
    """Retorna resumo do rating de um jogador."""
    player = database.get_player(username)
    if not player:
        player = database.get_or_create_player(username)

    last_results = database.get_last_n_results(username)
    total = len(last_results)
    wins = last_results.count('W')
    losses = last_results.count('L')
    draws = last_results.count('D')

    win_rate = (wins / total * 100) if total > 0 else 0
    loss_rate = (losses / total * 100) if total > 0 else 0
    draw_rate = (draws / total * 100) if total > 0 else 0

    is_provisional = player['games_played'] < PROVISIONAL_GAMES

    mult_w, mult_l = None, None
    if not is_provisional:
        mult_w, mult_l = get_performance_multiplier(last_results)

    return {
        'username': player['username'],
        'rating': player['rating'],
        'games_played': player['games_played'],
        'wins': player['wins'],
        'losses': player['losses'],
        'draws': player['draws'],
        'win_rate': round(win_rate, 1),
        'loss_rate': round(loss_rate, 1),
        'draw_rate': round(draw_rate, 1),
        'last_10_results': last_results,
        'is_provisional': is_provisional,
        'performance_multiplier_win': round(mult_w, 2) if mult_w else None,
        'performance_multiplier_loss': round(mult_l, 2) if mult_l else None,
    }
