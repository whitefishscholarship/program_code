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

export default function DifferentiationStep({ groups, profile, onToggle }: Props) {
  return (
    <div className="card-stack mt-4">
      {groups.map((group) => (
        <fieldset key={group.id} className="bare-fieldset">
          <legend className="sr-only">{group.title}</legend>
          <div className="panel">
          <p className="panel-title">{group.title}</p>
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
        </fieldset>
      ))}
    </div>
  );
}
