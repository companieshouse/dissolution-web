/*
 * eslint.config.js
 * Minimal migration shim that re-exports the existing legacy .eslintrc JSON
 * so you can adopt the new filename while keeping the original file for review.
 *
 * Note: this does not transform the old legacy format into the new "flat"
 * config format — it simply delegates to the existing configuration. This is
 * the safest, lowest-risk change and keeps linting behavior identical.
 */

module.exports = require("./.eslintrc")

