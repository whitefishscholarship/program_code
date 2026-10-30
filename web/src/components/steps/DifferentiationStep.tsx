'use client';

import { useState } from 'react';
import {
  chipSelected,
  type DifferentiationChip,
  type DifferentiationGroup,
  type DifferentiationProfile,
} from '@/lib/differentiation';

type Props = {
  groups: readonly DifferentiationGroup[];
  profile: DifferentiationProfile;
  onToggle: (chip: DifferentiationChip) => void;
};

function chipId(groupId: string, chip: DifferentiationChip): string {
  return `diff-${groupId}-${chip.field}-${chip.value}`.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
}

const NICHE_START_CLOSED = new Set(['school-clubs', 'aviation-groups', 'employers']);
const MANY_CHIPS = 8;

function canCollapse(group: DifferentiationGroup): boolean {
  return group.chips.length >= MANY_CHIPS || NICHE_START_CLOSED.has(group.id);
}

function startsClosed(group: DifferentiationGroup): boolean {
  return NICHE_START_CLOSED.has(group.id);
}

export default function DifferentiationStep({ groups, profile, onToggle }: Props) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  return (
    <div className="card-stack mt-4">
      {groups.map((group) => {
        const collapsible = canCollapse(group);
        const open = !collapsible || (group.id in openIds ? openIds[group.id] : !startsClosed(group));
        const selected = group.chips.filter((chip) => chipSelected(profile, chip)).length;
        const panelId = `diff-panel-${group.id}`;
        return (
        <fieldset key={group.id} className="bare-fieldset">
          <legend className="sr-only">{group.title}</legend>
          <div className="panel">
          {collapsible ? (
            <button
              type="button"
              className="panel-toggle"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenIds((current) => ({ ...current, [group.id]: !open }))}
            >
              <span className="panel-title">{group.title}</span>
              <span className="panel-meta">{open ? 'Hide' : selected > 0 ? `${selected} selected` : 'Show'}</span>
            </button>
          ) : (
            <p className="panel-title">{group.title}</p>
          )}
          <div id={panelId} hidden={!open}>
          <p className="hint">{group.hint}</p>
          {group.chips.length === 0 ? (
            <p className="hint mt-3">Nothing in the list uses this yet.</p>
          ) : group.layout === 'questions' ? (
            <ul className="question-list">
              {group.chips.map((chip) => {
                const checked = chipSelected(profile, chip);
                const id = chipId(group.id, chip);
                return (
                  <li key={id}>
                    <label
                      htmlFor={id}
                      className={`question-row has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-transparent${checked ? ' is-selected bg-teal-800' : ''}`}
                    >
                      <input
                        id={id}
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(chip)}
                        className="sr-only"
                      />
                      {chip.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="chip-row">
              {group.chips.map((chip) => {
                const checked = chipSelected(profile, chip);
                const id = chipId(group.id, chip);
                return (
                  <label
                    key={id}
                    htmlFor={id}
                    className={`chip has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-transparent${checked ? ' is-selected bg-teal-800' : ''}`}
                  >
                    <input
                      id={id}
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(chip)}
                      className="sr-only"
                    />
                    {chip.label}
                  </label>
                );
              })}
            </div>
          )}
          </div>
          </div>
        </fieldset>
        );
      })}
    </div>
  );
}
