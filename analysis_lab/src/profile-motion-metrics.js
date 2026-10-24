export function correlateMovingFrames(accepted, frames) {
  const latencies = [];
  let movementRequired = 0;
  let supersededBeforeMoving = 0;
  let noMatchingMovingFrame = 0;
  for (let index = 0; index < accepted.length; index += 1) {
    const sample = accepted[index];
    if (Math.abs(sample.fraction - sample.current) <= .0001) continue;
    movementRequired += 1;
    const nextAcceptedAt = accepted[index + 1]?.at ?? Infinity;
    const frame = frames.find(frame => frame.at >= sample.at && frame.at < nextAcceptedAt
      && Math.abs(frame.target - sample.fraction) < 1e-12
      && Math.abs(frame.current - sample.current) > 1e-9);
    if (frame) latencies.push(frame.at - sample.at);
    else if (Number.isFinite(nextAcceptedAt)) supersededBeforeMoving += 1;
    else noMatchingMovingFrame += 1;
  }
  return { latencies, movementRequired, supersededBeforeMoving, noMatchingMovingFrame };
}
