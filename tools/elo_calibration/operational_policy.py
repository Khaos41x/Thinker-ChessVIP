from __future__ import annotations


MAXIMUM_OPERATIONAL_FAILURE_PERCENT = 10


def maximum_operational_failures(record_count: int) -> int:
    if isinstance(record_count, bool) or not isinstance(record_count, int) or record_count < 0:
        raise ValueError("record_count must be a non-negative integer")
    return record_count * MAXIMUM_OPERATIONAL_FAILURE_PERCENT // 100


def validate_operational_failures(operational_failures: int, record_count: int) -> int:
    if isinstance(operational_failures, bool) or not isinstance(operational_failures, int) or operational_failures < 0:
        raise ValueError("operational_failures must be a non-negative integer")
    maximum = maximum_operational_failures(record_count)
    if operational_failures > record_count:
        raise ValueError("operational_failures cannot exceed record_count")
    if operational_failures > maximum:
        raise ValueError(
            f"operational failure rate exceeds {MAXIMUM_OPERATIONAL_FAILURE_PERCENT}%: "
            f"{operational_failures}/{record_count}"
        )
    return maximum
