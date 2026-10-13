export function invalidateEvaluation(state) {
  state.searchId += 1;
  state.evaluation = null;
}
