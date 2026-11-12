const modules = import.meta.glob('./**/*.js', { eager: true })

const registry = []
for (const path of Object.keys(modules)) {
  const mod = modules[path]
  if (mod.default) {
    registry.push(mod.default)
  }
}

export function getOccasion(id) {
  return registry.find((o) => o.id === id) || null
}

export { registry as occasions }
