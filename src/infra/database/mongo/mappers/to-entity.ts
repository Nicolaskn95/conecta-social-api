/**
 * Converte um documento/objeto do Mongo mapeando `_id` para `id`.
 */
export function toEntity<T>(doc: any): T {
  if (!doc) {
    return null as unknown as T;
  }

  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };

  if (obj._id !== undefined) {
    obj.id = String(obj._id);
    delete obj._id;
  }

  if (obj.__v !== undefined) {
    delete obj.__v;
  }

  return obj as T;
}

export function toEntityList<T>(docs: any[]): T[] {
  if (!Array.isArray(docs)) {
    return [];
  }
  return docs.map((d) => toEntity<T>(d));
}
