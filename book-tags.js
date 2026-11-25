// The same tabbed picker edits the classification before and after a book is added.
function mountBookTags(container, options, refreshIcons) {
  const key = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').replaceAll('œ', 'oe').trim();
  const names = {genres: 'Genres', subgenres: 'Sous-genres', tropes: 'Tropes'};
  const placeholders = {genres: 'Rechercher un genre', subgenres: 'Rechercher un sous-genre', tropes: 'Rechercher ou saisir un trope'};
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const tabs = element('div', 'ep-tag-tabs');
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Genres, sous-genres et tropes');
  const panel = element('div', 'ep-tag-panel');
  panel.id = container.closest('form').id + '-tag-panel';
  panel.setAttribute('role', 'tabpanel');
  const search = element('label', 'ep-tag-search');
  const icon = element('i', '');
  icon.dataset.lucide = 'search';
  icon.setAttribute('aria-hidden', 'true');
  const input = element('input', 'ep-tag-query');
  input.type = 'search';
  input.autocomplete = 'off';
  search.append(icon, input);
  const picked = element('div', 'ep-tag-values');
  const suggestions = element('div', 'ep-tag-suggestions');
  const live = element('span', 'sr-only');
  live.setAttribute('role', 'status');
  panel.append(search, suggestions, picked);
  container.append(tabs, panel, live);
  const changed = new Set();
  let active = 'genres';
  let values;
  let matches;

  function select(value, remove) {
    changed.add(active);
    if (remove) values[active] = values[active].filter(item => key(item) !== key(value));
    else {
      values[active].push(value);
      input.value = '';
    }
    render();
    live.textContent = value + (remove ? ' retiré.' : ' ajouté.');
    input.focus({preventScroll: true});
  }

  function chip(value, remove) {
    const button = element('button', 'ep-tag cursor-interaction', value);
    button.type = 'button';
    button.setAttribute('aria-label', (remove ? 'Retirer ' : 'Ajouter ') + value);
    if (remove) {
      const mark = element('span', 'ep-tag-symbol', '×');
      mark.setAttribute('aria-hidden', 'true');
      button.append(mark);
    }
    button.addEventListener('click', () => select(value, remove));
    return button;
  }

  function render() {
    const term = key(input.value);
    const selected = values[active];
    const chosen = new Set(selected.map(key));
    picked.hidden = !selected.length;
    picked.replaceChildren(...selected.map(value => chip(value, true)));
    matches = term ? options[active].filter(value => !chosen.has(key(value)) && key(value).includes(term))
      .sort((a, b) => Number(key(b).startsWith(term)) - Number(key(a).startsWith(term))) : [];
    if (active === 'tropes' && term && !chosen.has(term) && !matches.some(item => key(item) === term))
      matches = [input.value.trim().slice(0,120), ...matches];
    suggestions.hidden = !term;
    suggestions.replaceChildren(...(matches.length ? matches.slice(0, 8).map(value => chip(value, false))
      : term ? [element('p', '', 'Aucune suggestion.')] : []));
  }

  function chooseTab(name) {
    active = name;
    for (const button of tabs.children) {
      const selected = button.dataset.tab === name;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
    panel.setAttribute('aria-labelledby', panel.id + '-' + name);
    input.placeholder = placeholders[name];
    input.setAttribute('aria-label', placeholders[name]);
    input.value = '';
    render();
  }

  for (const [name, label] of Object.entries(names)) {
    const button = element('button', 'cursor-interaction', label);
    button.type = 'button';
    button.id = panel.id + '-' + name;
    button.dataset.tab = name;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panel.id);
    button.addEventListener('click', () => chooseTab(name));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const keys = Object.keys(names);
      const index = keys.indexOf(active);
      const target = event.key === 'Home' ? keys[0] : event.key === 'End' ? keys.at(-1)
        : keys[(index + (event.key === 'ArrowLeft' ? -1 : 1) + keys.length) % keys.length];
      chooseTab(target);
      tabs.querySelector('[aria-selected="true"]').focus();
    });
    tabs.append(button);
  }

  input.addEventListener('input', render);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const choice = matches.find(value => key(value) === key(input.value)) || (matches.length === 1 ? matches[0] : '');
      if (choice) select(choice, false);
    } else if (event.key === 'Escape' && input.value) {
      event.preventDefault();
      input.value = '';
      render();
    }
  });

  function set(book) {
    values = Object.fromEntries(Object.keys(names).map(name => {
      const initial = Array.isArray(book[name]) ? book[name] : String(book[name] ?? '').split(';');
      const unique = new Map(initial.filter(value => typeof value === 'string' && value.trim())
        .map(value => [key(value), value.trim()]));
      return [name, [...unique.values()]];
    }));
    changed.clear();
    live.textContent = '';
    chooseTab('genres');
  }
  set({});
  refreshIcons();
  return {set, update(book) {
    for (const name of Object.keys(names)) if (!changed.has(name)) values[name] = [...(book[name] || [])];
    render();
  }, changed: () => [...changed], values: () => Object.fromEntries(Object.keys(names).map(name => [name, [...values[name]]]))};
}
