import math


def _clamp(value):
    return max(0.0, min(1.0, float(value)))


def _utility(score_cp):
    return _clamp(0.5 + math.tanh(score_cp / 500) / 2)


def _entropy(lines, perception_elo):
    if len(lines) <= 1:
        return 0.0
    temperature = max(0.035, 0.18 - (max(600, min(3200, perception_elo)) - 600) / 26_000)
    utilities = [_utility(line.score_cp) for line in lines]
    peak = max(utilities)
    weights = [math.exp((value - peak) / temperature) for value in utilities]
    total = sum(weights)
    probabilities = [value / total for value in weights]
    return _clamp(-sum(value * math.log(value) for value in probabilities) / math.log(len(probabilities)))


def build_evidence(snapshot, board, perception_elo, *, familiarity=0.0):
    legal_moves_count = board.legal_moves.count()
    deep_lines = snapshot.deep or snapshot.shallow
    shallow_by_move = {line.move: line for line in snapshot.shallow}
    deep_by_move = {line.move: line for line in deep_lines}
    deep_best = deep_lines[0] if deep_lines else None
    shallow_best = snapshot.shallow[0] if snapshot.shallow else None
    selected = deep_by_move.get(snapshot.selected_move) or shallow_by_move.get(snapshot.selected_move)
    deep_regret = 0.0
    selected_regret = 0.0
    if deep_best and shallow_best:
        shallow_deep = deep_by_move.get(shallow_best.move)
        if shallow_deep:
            deep_regret = _clamp((_utility(deep_best.score_cp) - _utility(shallow_deep.score_cp)) * 2)
    if deep_best and selected:
        selected_regret = _clamp((_utility(deep_best.score_cp) - _utility(selected.score_cp)) * 2)
    move_instability = 1.0 if deep_best and shallow_best and deep_best.move != shallow_best.move else 0.0
    evaluation_instability = 0.0
    if deep_best and shallow_best:
        evaluation_instability = _clamp(abs(_utility(deep_best.score_cp) - _utility(shallow_best.score_cp)) * 2)
    choice_entropy = _entropy(deep_lines, perception_elo)
    forcedness = 1.0 if legal_moves_count == 1 else _clamp(1 - choice_entropy * 0.72 - min(1, legal_moves_count / 40) * 0.28)
    coverage = min(1.0, len(deep_lines) / max(1, min(5, legal_moves_count)))
    analysis_confidence = _clamp((0.9 if snapshot.deep else 0.45) * coverage)
    tactical_uncertainty = _clamp(evaluation_instability * 0.55 + move_instability * 0.45)
    position_balance = _clamp(1 - abs(_utility(deep_best.score_cp if deep_best else 0) - 0.5) * 2)
    decision_value = _clamp(
        deep_regret * 0.28
        + selected_regret * 0.18
        + move_instability * 0.2
        + evaluation_instability * 0.12
        + tactical_uncertainty * 0.1
        + choice_entropy * 0.12
        - forcedness * 0.2
        - _clamp(familiarity) * 0.18
    )
    replies = []
    for line in deep_lines[:3]:
        if len(line.pv) > 1:
            replies.append(line.pv[1])
    reason_codes = list(snapshot.reason_codes)
    if move_instability:
        reason_codes.append("BEST_MOVE_CHANGED")
    if deep_regret >= 0.35:
        reason_codes.append("HIGH_DEEP_REGRET")
    if choice_entropy >= 0.65:
        reason_codes.append("HIGH_CHOICE_ENTROPY")
    if legal_moves_count == 1:
        reason_codes.append("ONLY_LEGAL_MOVE")
    return {
        "decisionValue": decision_value,
        "forcedness": forcedness,
        "analysisConfidence": analysis_confidence,
        "moveProvenanceConfidence": 1.0 if snapshot.selected_move else 0.0,
        "choiceEntropy": choice_entropy,
        "deepRegret": deep_regret,
        "selectedMoveRegret": selected_regret,
        "moveInstability": move_instability,
        "evaluationInstability": evaluation_instability,
        "tacticalUncertainty": tactical_uncertainty,
        "pvForcingRatio": forcedness,
        "positionBalance": position_balance,
        "familiarity": _clamp(familiarity),
        "legalMovesCount": legal_moves_count,
        "viableCandidates": len(deep_lines),
        "phase": _phase(board),
        "predictedReplies": list(dict.fromkeys(replies)),
        "reasonCodes": list(dict.fromkeys(reason_codes)),
    }


def static_evidence(board, *, forced=False, familiarity=0.0, reason_codes=()):
    legal_moves_count = board.legal_moves.count()
    return {
        "decisionValue": 0.0,
        "forcedness": 1.0 if forced else 0.35,
        "analysisConfidence": 0.15,
        "moveProvenanceConfidence": 1.0,
        "choiceEntropy": 0.0,
        "deepRegret": 0.0,
        "selectedMoveRegret": 0.0,
        "moveInstability": 0.0,
        "evaluationInstability": 0.0,
        "tacticalUncertainty": 0.0,
        "pvForcingRatio": 1.0 if forced else 0.0,
        "positionBalance": 0.5,
        "familiarity": _clamp(familiarity),
        "legalMovesCount": legal_moves_count,
        "viableCandidates": 1,
        "phase": _phase(board),
        "predictedReplies": [],
        "reasonCodes": list(reason_codes),
    }


def _phase(board):
    queens = len(board.pieces(5, True)) + len(board.pieces(5, False))
    non_pawn_material = sum(
        len(board.pieces(piece_type, color)) * value
        for color in (True, False)
        for piece_type, value in ((2, 3), (3, 3), (4, 5), (5, 9))
    )
    if board.fullmove_number <= 10 and non_pawn_material >= 48:
        return "opening"
    if queens == 0 or non_pawn_material <= 20:
        return "endgame"
    return "middlegame"
