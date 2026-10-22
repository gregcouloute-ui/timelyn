import { demoContinueAs } from "@/app/(auth)/actions";
import { demoRepository } from "@/lib/data/demo/store";

/** Demo mode: step into the example family as one of its members. */
export function DemoPersonas({ next }: { next: string }) {
  const personas = demoRepository.listUsers().filter((u) => u.persona);
  return (
    <div>
      <ul className="flex flex-col gap-3">
        {personas.map((u) => (
          <li key={u.id}>
            <form action={demoContinueAs}>
              <input type="hidden" name="userId" value={u.id} />
              <input type="hidden" name="next" value={next} />
              <button
                type="submit"
                className="press group grid w-full grid-cols-[2.5rem_1fr] items-start gap-4 bg-paper p-3 text-left hover:bg-pop focus-visible:bg-pop"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-10 items-center justify-center border-2 border-black bg-sun font-display text-lede text-black"
                >
                  {u.displayName[0]}
                </span>
                <span>
                  <span className="block text-body font-bold text-ink">
                    Continue as {u.displayName}
                  </span>
                  <span className="block text-small font-medium text-ink-soft group-hover:text-black">
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
