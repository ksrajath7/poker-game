export function runOnce(fn) {
  let hasRun = false;
  return function () {
    if (!hasRun) {
      hasRun = true;
      fn.apply(this, arguments);
    }
  };
}
