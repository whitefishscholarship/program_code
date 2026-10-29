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

export default function DifferentiationStep({ groups, profile, onToggle }: Props) {
  return (
    <div className="mt-7 space-y-7">
      {groups.map((group) => (
        <fieldset key={group.id} className="rounded-2xl border border-slate-200 p-4">
          <legend className="px-2 text-base font-bold text-slate-950">{group.title}</legend>
          <p className="mt-1 text-sm leading-6 text-slate-600">{group.hint}</p>
          {group.chips.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">Nothing in the list uses this yet.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {group.chips.map((chip) => {
                const checked = chipSelected(profile, chip);
                const id = `diff-${group.id}-${chip.field}-${chip.value}`.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
                return (
                  <label
                    key={id}
                    htmlFor={id}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${checked ? 'border-teal-700 bg-teal-50 text-teal-950' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}
                  >
                    <input
                      id={id}
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(chip)}
                      className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                    />
                    {chip.label}
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>
      ))}
    </div>
  );
}
