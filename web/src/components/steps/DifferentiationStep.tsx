'use client';

import type { ReactNode } from 'react';
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
  extras?: Readonly<Record<string, { selected: number; node: ReactNode }>>;
};

function chipText(chip: DifferentiationChip): string {
  return typeof chip.count === 'number' ? `${chip.label} (${chip.count})` : chip.label;
}

function chipId(groupId: string, chip: DifferentiationChip): string {
  return `diff-${groupId}-${chip.field}-${chip.value}`.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
}

function ChipControl({ groupId, chip, profile, onToggle }: { groupId: string; chip: DifferentiationChip; profile: DifferentiationProfile; onToggle: (chip: DifferentiationChip) => void }) {
  const checked = chipSelected(profile, chip);
  const id = chipId(groupId, chip);
  return (
    <label
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
      {chipText(chip)}
    </label>
  );
}

export default function DifferentiationStep({ groups, profile, onToggle, extras }: Props) {
  return (
    <div className="card-stack mt-4">
      {groups.map((group) => {
        const extra = extras?.[group.id];
        const top = group.chips.filter((chip) => !chip.nestUnder);
        const nestedParents = top.filter((chip) => group.chips.some((item) => item.nestUnder === chip.value));
        return (
          <fieldset key={group.id} className="bare-fieldset">
            <legend className="sr-only">{group.title}</legend>
            <div className="panel">
              <p className="panel-title">{group.title}</p>
              <p className="hint">{group.hint}</p>
              {group.chips.length === 0 ? (
                <p className="hint mt-3">Nothing in the list uses this yet.</p>
              ) : (
                <>
                  <div className="chip-row">
                    {top.map((chip) => <ChipControl key={chipId(group.id, chip)} groupId={group.id} chip={chip} profile={profile} onToggle={onToggle} />)}
                    {extra?.node}
                  </div>
                  {nestedParents.map((parent) => {
                    const nested = group.chips.filter((chip) => chip.nestUnder === parent.value);
                    return (
                      <div key={`${group.id}-${parent.value}-nest`}>
                        <p className="hint mt-3">Aviation choices inside {parent.label}. These do not hide other scholarships.</p>
                        <div className="chip-row">
                          {nested.map((chip) => <ChipControl key={chipId(group.id, chip)} groupId={group.id} chip={chip} profile={profile} onToggle={onToggle} />)}
                        </div>
                      </div>
                    );
                  })}
                  {group.emptyNote ? <p className="hint mt-3">{group.emptyNote}</p> : null}
                </>
              )}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
