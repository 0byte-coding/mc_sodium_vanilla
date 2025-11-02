# Bun Trusted Dependencies

Bun does not run `postinstall` scripts automatically as a security measure.

## Enabling postinstall Scripts

If a package requires `postinstall` scripts to function, add it to `trustedDependencies` in `package.json`:

```json
{
  "trustedDependencies": ["my-trusted-package"]
}
```

**NEVER** blindly add packages to `trustedDependencies` without understanding what the `postinstall` script does.
