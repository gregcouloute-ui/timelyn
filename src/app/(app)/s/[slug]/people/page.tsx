import type { Metadata } from "next";
import { InviteForm, MemberControls } from "@/components/people/people";
import { Confirm } from "@/components/ui/confirm";
import { shortName } from "@/lib/domain/names";
import { ROLE_LABEL, can } from "@/lib/domain/permissions";
import { invitationState, loadPeople } from "@/lib/services/members";
import { loadStoryPage } from "@/lib/story-page";
import { changeRoleAction, inviteAction, removeMemberAction, withdrawInvitationAction } from "../actions";

export const metadata: Metadata = { title: "People" };

const STATE_LABEL = { open: "Waiting", accepted: "Joined", revoked: "Withdrawn", expired: "Expired" } as const;

export default async function PeoplePage({ params }: PageProps<"/s/[slug]/people">) {
  const { slug } = await params;
  const { story, role, viewer, repo } = await loadStoryPage(slug);
  const { members, invitations } = await loadPeople(repo, { story, role });
  const first = shortName(story.subjectName, story.knownAs);
  const assignable = can.assignableRoles(role);
  const pendingInvites = invitations.filter((i) => invitationState(i) === "open");
  const pastInvites = invitations.filter((i) => invitationState(i) !== "open").slice(0, 8);

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-8 sm:pt-14">
      <h1 className="text-h1 uppercase">People</h1>
      <p className="mt-4 max-w-2xl text-body text-ink-soft">
        Everyone here can read {first}&rsquo;s story. Nobody else can, and nothing is ever public.
      </p>

      <div className="mt-12 grid gap-16 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-labelledby="members">
          <h2 id="members" className="text-h3">
            Taking part <span className="text-ink-faint numerals-oldstyle">{members.length}</span>
          </h2>
          <ul className="mt-4 divide-y-2 divide-black border-y-[3px] border-black">
            {members.map((m) => {
              const manageable = m.userId !== viewer.id && can.manageMember(role, m.role);
              return (
                <li key={m.userId} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center border-2 border-black bg-pop font-display text-lede text-black">
                      {m.displayName[0]}
                    </span>
                    <div>
                      <p className="text-body text-ink">
                        {m.displayName}
                        {m.userId === viewer.id ? <span className="text-ink-faint"> (you)</span> : null}
                      </p>
                      <p className="text-small text-ink-soft">
                        {[m.relationship, manageable ? null : ROLE_LABEL[m.role]].filter(Boolean).join(". ")}
                      </p>
                    </div>
                  </div>
                  {manageable ? (
                    <MemberControls
                      member={m}
                      roles={assignable}
                      storyName={first}
                      changeAction={changeRoleAction.bind(null, slug)}
                      removeAction={removeMemberAction.bind(null, slug, m.userId)}
                    />
                  ) : m.userId === viewer.id && m.role !== "owner" ? (
                    <Confirm
                      trigger="Leave this story"
                      title="Leave this story?"
                      description={<p>You&rsquo;ll no longer be able to read {first}&rsquo;s story. The moments you added will stay.</p>}
                      confirmLabel="Leave"
                      action={removeMemberAction.bind(null, slug, m.userId)}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>

          {can.inviteMembers(role) && (pendingInvites.length || pastInvites.length) ? (
            <div className="mt-14">
              <h2 className="text-h3">Invitations</h2>
              <ul className="mt-4 divide-y-2 divide-black border-y-[3px] border-black">
                {[...pendingInvites, ...pastInvites].map((i) => {
                  const st = invitationState(i);
                  return (
                    <li key={i.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-ui text-ink">{i.email}</p>
                        <p className="text-small text-ink-soft">
                          {ROLE_LABEL[i.role]}, invited by {i.invitedByName}. {STATE_LABEL[st]}.
                        </p>
                      </div>
                      {st === "open" && assignable.includes(i.role) ? (
                        <Confirm
                          trigger="Withdraw"
                          title="Withdraw this invitation?"
                          description={<p>The link sent to {i.email} will stop working.</p>}
                          confirmLabel="Withdraw"
                          action={withdrawInvitationAction.bind(null, slug, i.id)}
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </section>

        {can.inviteMembers(role) ? (
          <section aria-labelledby="invite" className="lg:border-l-[3px] lg:border-black lg:pl-12">
            <h2 id="invite" className="text-h3">Invite someone</h2>
            <p className="mt-2 text-ui text-ink-soft">
              You&rsquo;ll get a private link to send them. They&rsquo;ll need to sign in with this email address to join.
            </p>
            <div className="mt-6">
              <InviteForm action={inviteAction.bind(null, slug)} roles={assignable} subjectFirstName={first} />
            </div>
          </section>
        ) : (
          <aside className="text-ui text-ink-soft lg:border-l-[3px] lg:border-black lg:pl-12">
            <p>Want someone else to see the story? Ask the story keeper to invite them.</p>
          </aside>
        )}
      </div>
    </main>
  );
}
