import { demoContinueAs } from "@/app/(auth)/actions";
import { demoRepository } from "@/lib/data/demo/store";

/** Demo mode: step into the example family as one of its members. */
export function DemoPersonas({ next }: { next: string }) {
  const personas = demoRepository.listUsers().filter((u) => u.persona);
  return (
    <div>
      <ul className="divide-y divide-rule border-y border-rule">
        {personas.map((u) => (
          <li key={u.id}>
            <form action={demoContinueAs}>
              <input type="hidden" name="userId" value={u.id} />
              <input type="hidden" name="next" value={next} />
              <button
                type="submit"
                className="group grid w-full grid-cols-[2.5rem_1fr] items-start gap-4 py-4 text-left transition-colors hover:bg-paper-sunk focus-visible:bg-paper-sunk"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-10 items-center justify-center rounded-full bg-cyan-wash font-serif text-lede text-cyan"
                >
                  {u.displayName[0]}
                </span>
                <span>
                  <span className="block text-body font-medium text-ink group-hover:text-cyan">
                    Continue as {u.displayName}
                  </span>
                  <span className="block text-small text-ink-soft">
                    {u.persona!.relationship}. {u.persona!.summary}
                  </span>
                </span>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
