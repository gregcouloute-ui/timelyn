import { monthName } from "@/lib/domain/dates";
import { FieldError, Input, Select, describedBy } from "./field";

interface DateFieldsProps {
  legend: string;
  hint?: string;
  names: { year: string; month: string; day: string; circa?: string };
  defaults?: { year?: string | number | null; month?: string | number | null; day?: string | number | null; circa?: boolean };
  errors?: Partial<Record<string, string>>;
  required?: boolean;
  idPrefix: string;
}

/**
 * Families rarely know every date exactly. Only the year is required; month
 * and day can be left blank, and the date can be marked as approximate.
 */
export function DateFields({ legend, hint, names, defaults = {}, errors = {}, required = true, idPrefix }: DateFieldsProps) {
  const yearId = `${idPrefix}-year`;
  const error = errors[names.year] ?? errors[names.month] ?? errors[names.day];
  return (
    <fieldset className="flex flex-col gap-1.5" aria-describedby={describedBy(idPrefix, hint, error)}>
      <legend className="mb-1.5 text-ui font-bold text-ink">{legend}</legend>
      {hint ? (
        <p id={`${idPrefix}-hint`} className="-mt-1 mb-1 text-small text-ink-soft">
          {hint}
        </p>
      ) : null}
      <div className="grid grid-cols-[5.5rem_minmax(0,9.5rem)_minmax(0,6.5rem)] gap-2.5 sm:grid-cols-[6rem_11rem_7rem]">
        <div className="flex flex-col gap-1">
          <label htmlFor={yearId} className="text-small text-ink-soft">
            Year
          </label>
          <Input
            id={yearId}
            name={names.year}
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]{4}"
            maxLength={4}
            required={required}
            defaultValue={defaults.year ?? ""}
            aria-invalid={Boolean(errors[names.year]) || undefined}
            className="numerals-tabular"
            placeholder="1974"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-month`} className="text-small text-ink-soft">
            Month
          </label>
          <Select
            id={`${idPrefix}-month`}
            name={names.month}
            defaultValue={defaults.month ? String(defaults.month) : ""}
            aria-invalid={Boolean(errors[names.month]) || undefined}
          >
            <option value="">Not sure</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>
                {monthName(i + 1)}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-day`} className="text-small text-ink-soft">
            Day
          </label>
          <Input
            id={`${idPrefix}-day`}
            name={names.day}
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]{1,2}"
            maxLength={2}
            defaultValue={defaults.day ?? ""}
            aria-invalid={Boolean(errors[names.day]) || undefined}
            className="numerals-tabular"
          />
        </div>
      </div>
      {names.circa ? (
        <label className="mt-1.5 inline-flex cursor-pointer items-center gap-2.5 text-ui text-ink-soft">
          <input
            type="checkbox"
            name={names.circa}
            defaultChecked={defaults.circa}
            className="size-5 accent-black"
          />
          This date is approximate
        </label>
      ) : null}
      <FieldError id={`${idPrefix}-error`} message={error} />
    </fieldset>
  );
}
