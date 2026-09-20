/** Pure, escaped view helpers. The application owns events and state. */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

export function renderResults(result, {emptyMessage = 'Your results will appear here. Run a query when you are ready.', caption = 'Query results'} = {}) {
  if (!result) return `<div class="empty-state"><span class="empty-crosshair" aria-hidden="true">＋</span><h3>Ready for your first readback</h3><p>${escapeHtml(emptyMessage)}</p></div>`;
  const columns = Array.isArray(result.columns) ? result.columns : [];
  const rows = Array.isArray(result.values) ? result.values : [];
  const cell = value => value === null ? '<span class="null-value" title="No value recorded">NULL</span>' : escapeHtml(value);
  return `<div class="result-summary"><span><strong>${escapeHtml(result.rowCount ?? rows.length)}</strong> rows${result.truncated ? ' (display limited)' : ''} · ${columns.length} columns</span><span class="muted">Read-only results</span></div>
    ${result.truncated ? '<p class="row-cap-notice" role="status">The display limit has been reached. Narrow your query with WHERE or TOP to inspect a smaller set.</p>' : ''}
    ${columns.length ? `<div class="results-scroll" tabindex="0" role="region" aria-label="Scrollable query results"><table class="data-table"><caption class="visually-hidden">${escapeHtml(caption)}</caption><thead><tr>${columns.map(column => `<th scope="col">${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${columns.map((_, index) => `<td class="${typeof row[index] === 'number' ? 'numeric' : ''}">${cell(row[index])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
    ${rows.length === 0 ? '<div class="empty-state compact"><h3>No matching rows</h3><p>Your query ran successfully. Try broadening the conditions to explore more records.</p></div>' : ''}`;
}

function referenceText(reference) {
  if (typeof reference === 'string') return reference;
  if (reference && typeof reference === 'object') return [reference.table ?? reference.tableName, reference.column ?? reference.field].filter(Boolean).join('.');
  return '';
}

export function renderSchema(schema, selectedTable) {
  const selected = schema.find(table => table.name === selectedTable) ?? schema[0];
  if (!selected) return '<p>No tables available.</p>';
  return `<div class="schema-relationship-overview" aria-label="Database relationships"><p class="eyebrow">How the records connect</p><div class="relationship-path">CUSTOMERS <span>← SALES →</span> PARTS <span>← INVENTORY</span></div><div class="relationship-path">VENDORS <span>← REPAIR_ORDERS →</span> PARTS</div><p class="muted">Arrows point toward the table a record refers to. Inventory can also refer to its source repair order.</p></div><div class="schema-layout"><div class="schema-map"><p class="eyebrow">Six connected tables</p><p class="muted">Select a table to inspect its fields.</p>${schema.map(table => `<button type="button" class="schema-node ${table.name === selected.name ? 'selected' : ''}" data-table="${escapeHtml(table.name)}" aria-pressed="${table.name === selected.name}"><span class="schema-node-name">${escapeHtml(table.name)}</span><span class="muted">${table.columns.length} fields</span></button>`).join('')}<div class="schema-legend"><span class="badge">PK</span> identifies one record<br><span class="badge">FK</span> connects to another table</div></div><div class="dictionary"><p class="eyebrow">Data dictionary</p><h3>${escapeHtml(selected.name)}</h3><p>${escapeHtml(selected.description)}</p><dl>${selected.columns.map(column => { const reference = referenceText(column.references); const primary = Array.isArray(selected.primaryKey) ? selected.primaryKey.includes(column.name) : selected.primaryKey === column.name; return `<div class="dictionary-field"><dt><code>${escapeHtml(column.name)}</code>${primary ? ' <span class="badge">PK</span>' : ''}${reference ? ' <span class="badge">FK</span>' : ''}<span class="field-type">${escapeHtml(column.type)}</span></dt><dd>${escapeHtml(column.description)}${reference ? `<span class="field-reference">Connects to <code>${escapeHtml(reference)}</code></span>` : ''}</dd></div>`; }).join('')}</dl></div></div>`;
}

export function renderReference(reference, completedIds = [], activeConcepts = []) {
  const completed = new Set(completedIds);
  return `<div class="reference-grid">${reference.map(item => {
    const relevant = item.concept.split(/\s*\/\s*/).some(concept => activeConcepts.includes(concept));
    const unlocked = !item.future && (item.unlockAfter == null || completed.has(item.unlockAfter) || relevant);
    return `<article class="reference-card ${unlocked ? '' : 'locked'}"><div class="panel-header"><h3>${escapeHtml(item.concept)}</h3><span class="status-pill ${unlocked ? '' : 'offline'}">${unlocked ? '● ONLINE' : '○ LOCKED'}</span></div>${unlocked ? `<p>${escapeHtml(item.description)}</p><pre><code>${escapeHtml(item.example)}</code></pre>` : `<p class="muted">${item.future ? 'Coming in a future qualification.' : 'Complete the preceding mission to bring this concept online.'}</p>`}</article>`;
  }).join('')}</div>`;
}

