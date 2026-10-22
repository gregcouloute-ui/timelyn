/**
 * Demonstration content: the Ellison family.
 *
 * Every person, place and event here is fictional. The photographs are
 * procedurally generated plates (see scripts/generate-demo-media.py) rather
 * than stock imagery.
 */
import type { Chapter, MomentStatus, PartialDate, Role, Story } from "@/lib/domain/types";

export const demoId = (group: number, n: number) =>
  `00000000-0000-4000-8${group.toString(16).padStart(3, "0")}-${n.toString(16).padStart(12, "0")}`;

export interface DemoUser {
  id: string;
  email: string;
  displayName: string;
  /** Shown on the demo sign-in screen. */
  persona?: { relationship: string; summary: string };
}

export interface DemoMember {
  storyId: string;
  userId: string;
  role: Role;
  relationship: string | null;
  joinedAt: string;
}

export interface DemoMomentRow {
  id: string;
  storyId: string;
  title: string;
  body: string | null;
  date: PartialDate;
  place: string | null;
  people: string[];
  isMilestone: boolean;
  status: MomentStatus;
  contributorId: string;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DemoMediaRow {
  id: string;
  storyId: string;
  momentId: string | null;
  purpose: "moment" | "cover";
  kind: "image" | "video" | "audio";
  path: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  caption: string | null;
  position: number;
  uploadedBy: string;
  createdAt: string;
}

const d = (year: number, month: number | null = null, day: number | null = null, circa = false): PartialDate => ({
  year,
  month,
  day,
  circa,
});

export const USERS = {
  ruth: demoId(1, 1),
  david: demoId(1, 2),
  tom: demoId(1, 3),
  sandra: demoId(1, 4),
  margaret: demoId(1, 5),
};

export const STORIES = { margaret: demoId(2, 1), walter: demoId(2, 2) };

export function buildSeed() {
  const users: DemoUser[] = [
    {
      id: USERS.ruth,
      email: "ruth@ellison.example",
      displayName: "Ruth Ellison",
      persona: { relationship: "Peggy's daughter", summary: "Keeps both family stories and approves contributions." },
    },
    {
      id: USERS.david,
      email: "david@ellison.example",
      displayName: "David Ellison",
      persona: { relationship: "Peggy's son", summary: "An editor. Reviews contributions and invites family." },
    },
    {
      id: USERS.tom,
      email: "tom@ellison.example",
      displayName: "Tom Ellison",
      persona: { relationship: "Peggy's grandson", summary: "A contributor. His additions wait for review." },
    },
    {
      id: USERS.sandra,
      email: "sandra@okafor.example",
      displayName: "Sandra Okafor",
      persona: { relationship: "Peggy's friend since art school", summary: "A reader of Walter's story, and a contributor to Peggy's." },
    },
    { id: USERS.margaret, email: "peggy@ellison.example", displayName: "Peggy Ellison" },
  ];

  const now = "2026-10-01T10:00:00.000Z";

  const stories: Story[] = [
    {
      id: STORIES.margaret,
      slug: "peggy-ellison",
      subjectName: "Margaret Ellison",
      knownAs: "Peggy",
      birthDate: d(1951, 3, 14),
      birthPlace: "Whitby, North Yorkshire",
      deathDate: null,
      deathPlace: null,
      introduction:
        "Peggy was born above her father's chandlery in Whitby, studied painting in Leeds, married Walter in 1974 and ran Ellison's Books on Otley Road for seventeen years. Her family is gathering her story here, and a good deal of it is in her own words.",
      coverMediaId: demoId(4, 100),
      createdBy: USERS.ruth,
      createdAt: "2026-05-02T09:12:00.000Z",
      updatedAt: now,
    },
    {
      id: STORIES.walter,
      slug: "walter-ellison",
      subjectName: "Walter James Ellison",
      knownAs: "Walt",
      birthDate: d(1946, 10, 9),
      birthPlace: "Barnsley, South Yorkshire",
      deathDate: d(2019, 3, 2),
      deathPlace: "Leeds",
      introduction:
        "A joiner by trade and a folk fiddler by inclination. Walt made most of the furniture in the house on Clarendon Road, and some of the arguments.",
      coverMediaId: demoId(4, 200),
      createdBy: USERS.ruth,
      createdAt: "2026-06-11T18:40:00.000Z",
      updatedAt: now,
    },
  ];

  const members: DemoMember[] = [
    { storyId: STORIES.margaret, userId: USERS.ruth, role: "owner", relationship: "Daughter", joinedAt: "2026-05-02T09:12:00.000Z" },
    { storyId: STORIES.margaret, userId: USERS.david, role: "editor", relationship: "Son", joinedAt: "2026-05-03T19:00:00.000Z" },
    { storyId: STORIES.margaret, userId: USERS.tom, role: "contributor", relationship: "Grandson", joinedAt: "2026-05-04T16:20:00.000Z" },
    { storyId: STORIES.margaret, userId: USERS.margaret, role: "contributor", relationship: "Herself", joinedAt: "2026-05-04T11:00:00.000Z" },
    { storyId: STORIES.margaret, userId: USERS.sandra, role: "contributor", relationship: "Friend since art school", joinedAt: "2026-05-20T20:05:00.000Z" },
    { storyId: STORIES.walter, userId: USERS.ruth, role: "owner", relationship: "Daughter", joinedAt: "2026-06-11T18:40:00.000Z" },
    { storyId: STORIES.walter, userId: USERS.david, role: "editor", relationship: "Son", joinedAt: "2026-06-12T08:00:00.000Z" },
    { storyId: STORIES.walter, userId: USERS.margaret, role: "contributor", relationship: "Wife", joinedAt: "2026-06-12T10:30:00.000Z" },
    { storyId: STORIES.walter, userId: USERS.tom, role: "contributor", relationship: "Grandson", joinedAt: "2026-06-13T21:10:00.000Z" },
    { storyId: STORIES.walter, userId: USERS.sandra, role: "viewer", relationship: "Family friend", joinedAt: "2026-06-20T09:00:00.000Z" },
  ];

  const chapters: Chapter[] = [
    { id: demoId(3, 1), storyId: STORIES.margaret, title: "Whitby", startYear: 1951, summary: "The youngest of three, growing up between the harbour and the chandlery on Church Street." },
    { id: demoId(3, 2), storyId: STORIES.margaret, title: "Leeds, and the art school", startYear: 1967, summary: "A scholarship, a shared flat on Hyde Park Road and three years of paint under her fingernails." },
    { id: demoId(3, 3), storyId: STORIES.margaret, title: "Walter", startYear: 1972, summary: "A folk night at the Brudenell, a wedding in the rain and a house that needed everything doing." },
    { id: demoId(3, 4), storyId: STORIES.margaret, title: "A family on Clarendon Road", startYear: 1977, summary: "Ruth and David, caravans at Filey and a kitchen table that was never clear." },
    { id: demoId(3, 5), storyId: STORIES.margaret, title: "Ellison's Books", startYear: 1992, summary: "Seventeen years behind the counter of a bookshop on Otley Road." },
    { id: demoId(3, 6), storyId: STORIES.margaret, title: "The garden years", startYear: 2010, summary: "Grandchildren, sweet peas, and learning to live without Walt." },
    { id: demoId(3, 11), storyId: STORIES.walter, title: "Barnsley", startYear: 1946, summary: "A pit village childhood, and a firm decision not to go down it." },
    { id: demoId(3, 12), storyId: STORIES.walter, title: "Leeds", startYear: 1966, summary: "Joinery, music and Peggy." },
    { id: demoId(3, 13), storyId: STORIES.walter, title: "Later years", startYear: 2008, summary: "Retirement, of a sort." },
  ];

  let n = 0;
  const moments: DemoMomentRow[] = [];
  const media: DemoMediaRow[] = [];

  function moment(
    storyId: string,
    contributorId: string,
    date: PartialDate,
    title: string,
    body: string | null,
    opts: {
      place?: string;
      people?: string[];
      milestone?: boolean;
      status?: MomentStatus;
      reviewNote?: string;
      images?: { file: string; caption?: string }[];
      audio?: { file: string; caption?: string; duration: number };
    } = {},
  ) {
    n += 1;
    const id = demoId(5, n);
    const status = opts.status ?? "published";
    const created = new Date(Date.UTC(2026, 4, 2) + n * 36e5 * 7).toISOString();
    moments.push({
      id,
      storyId,
      title,
      body,
      date,
      place: opts.place ?? null,
      people: opts.people ?? [],
      isMilestone: opts.milestone ?? false,
      status,
      contributorId,
      reviewNote: opts.reviewNote ?? null,
      reviewedBy: status === "pending" ? null : storyId === STORIES.margaret ? USERS.ruth : USERS.david,
      reviewedAt: status === "pending" ? null : created,
      publishedAt: status === "published" ? created : null,
      createdAt: created,
      updatedAt: created,
    });
    (opts.images ?? []).forEach((img, i) => {
      media.push({
        id: demoId(4, n * 10 + i + 1000),
        storyId,
        momentId: id,
        purpose: "moment",
        kind: "image",
        path: `demo/${img.file}`,
        mimeType: "image/jpeg",
        sizeBytes: 300_000,
        width: 1600,
        height: 1067,
        durationSeconds: null,
        caption: img.caption ?? null,
        position: i,
        uploadedBy: contributorId,
        createdAt: created,
      });
    });
    if (opts.audio) {
      media.push({
        id: demoId(4, n * 10 + 1009),
        storyId,
        momentId: id,
        purpose: "moment",
        kind: "audio",
        path: `demo/${opts.audio.file}`,
        mimeType: "audio/wav",
        sizeBytes: 970_000,
        width: null,
        height: null,
        durationSeconds: opts.audio.duration,
        caption: opts.audio.caption ?? null,
        position: 9,
        uploadedBy: contributorId,
        createdAt: created,
      });
    }
    return id;
  }

  const M = STORIES.margaret;
  const W = STORIES.walter;
  const { ruth, david, tom, sandra, margaret } = USERS;

  // ---- Peggy: Whitby
  moment(M, margaret, d(1951, 3, 14), "Born on Church Street",
    "I arrived in the front bedroom above the chandlery in the middle of a March gale. Mam always said the midwife came up the 199 steps backwards because the wind wouldn't let her face it. I was the third, after Jean and Alan, and by all accounts the loudest.",
    { place: "Church Street, Whitby", people: ["Jean", "Alan"], milestone: true });
  moment(M, david, d(1956, null, null, true), "The harbour in winter",
    "Grandad Hartley took this from the West Pier with a camera he'd swapped for a coil of rope. Mum kept the print in her sewing tin for sixty years, and it's the only picture any of us have of the town as she first knew it.",
    { place: "West Pier, Whitby", images: [{ file: "whitby-harbour-1956.jpg", caption: "Printed by Grandad Hartley in the back kitchen. The headland houses are still there." }] });
  moment(M, margaret, d(1959, 8), "A day at Sandsend",
    "Every summer Dad shut the shop for one Saturday and we walked the beach to Sandsend and back. Alan carried the sandwiches and ate most of them before the halfway mark. I remember the cold of the sea more than anything; you went numb to the knees and called it swimming.",
    { place: "Sandsend", people: ["Jean", "Alan", "Dad"], images: [{ file: "sandsend-1959.jpg", caption: "Low tide looking north, the only frame on the roll that wasn't of Alan pulling faces." }] });
  moment(M, ruth, d(1962, 9), "A scholarship to the grammar school",
    "Mum was the first in her family to stay on at school. She won a county scholarship, which meant a uniform the family couldn't really afford and a bus to Scarborough every morning. She still talks about Miss Pickering, the art mistress who told her she had \"a proper eye\".",
    { milestone: true, place: "Scarborough", people: ["Miss Pickering"], images: [{ file: "classroom-window-1962.jpg", caption: "The art room window, from a photograph Miss Pickering sent Mum years later." }] });

  // ---- Peggy: Leeds
  moment(M, margaret, d(1967, 9, 18), "Leaving for Leeds",
    "Dad drove me to York in the van with my trunk wedged between the paraffin and the boat hooks. He didn't say much. At the station he gave me a ten-shilling note and told me not to come home talking posh. I nearly turned round twice before Doncaster.",
    { milestone: true, place: "York station", people: ["Dad"] });
  moment(M, sandra, d(1968, 11), "Our first winter on Hyde Park Road",
    "Peggy and I shared the top flat at number 41 with a gas fire that took shillings and a landlord who took everything else. We painted by the window in our coats. She taught me to make a stew out of nothing, and I taught her to dance, badly.",
    { place: "Hyde Park Road, Leeds", people: ["Sandra Okafor"], images: [{ file: "leeds-evening-1968.jpg", caption: "The view from our window towards Woodhouse Moor, painted over in my memory a hundred times." }] });
  moment(M, sandra, d(1970, 6), "The degree show",
    "Her final show was six big canvases of the North Sea that made everyone else's work look timid. A man from a Harrogate gallery bought one on the opening night. She spent the money on a bicycle and a winter coat, in that order.",
    { place: "Leeds College of Art", images: [{ file: "art-school-canvas-1970.jpg", caption: "Detail from the last surviving canvas, which hangs in Ruth's hallway." }] });

  // ---- Peggy: Walter
  moment(M, margaret, d(1972, 2, null), "A folk night at the Brudenell",
    "Walt was playing the fiddle in a band that couldn't agree on a key. I told him so at the bar, and he said if I was so clever I could come back next week and tell him again. I went back every week for two years.",
    { place: "The Brudenell, Leeds", people: ["Walter Ellison"] });
  moment(M, ruth, d(1974, 6, 22), "Wedding at St Michael's",
    "It rained from start to finish and nobody minded. Mum made her own dress from a pattern in Woman's Own, and Dad built the trestle tables for the reception the night before. Aunty Jean caught the bouquet and claimed for forty years that she hadn't been trying.",
    { milestone: true, place: "St Michael's, Headingley", people: ["Walter Ellison", "Jean", "Sandra Okafor"], images: [{ file: "wedding-1974.jpg", caption: "Confetti and rain on the church steps." }] });
  moment(M, david, d(1975, 3), "The house on Clarendon Road",
    "They bought a terrace that had been empty for three years and had a tree growing in the scullery. Dad stripped it back to the bricks while Mum painted every evening by the one window that faced west. It's still the house we think of when anyone says home.",
    { place: "Clarendon Road, Leeds", images: [{ file: "clarendon-road-1975.jpg", caption: "The back bedroom that became Mum's studio." }] });

  // ---- Peggy: Family
  moment(M, david, d(1977, 2, 3), "Ruth is born",
    "Ruth arrived three weeks early during a power cut, which Dad said explained a great deal about her.",
    { milestone: true, place: "Leeds General Infirmary", people: ["Ruth Ellison"] });
  moment(M, ruth, d(1979, 7, 30), "David is born",
    "David came in the middle of a heatwave. Mum says he was the calmest baby on the ward and has been making up for it since.",
    { milestone: true, place: "Leeds General Infirmary", people: ["David Ellison"] });
  moment(M, david, d(1983, 8), "August at Filey",
    "Every August we took the same caravan at Primrose Valley. Dad fished, Mum sketched, Ruth read and I fell off things. This is the one week a year the four of us were never anywhere else.",
    { place: "Filey", people: ["Ruth", "David", "Walter"], images: [{ file: "filey-caravan-1983.jpg", caption: "The view from the caravan step. Dad's flask is just out of frame." }] });
  moment(M, ruth, d(1987, 1, 12), "The big snow",
    "School shut for a week. Mum got us up in the dark to walk to the park before anyone else had touched it, and we stood in the trees listening to nothing at all.",
    { place: "Hyde Park, Leeds", images: [{ file: "winter-1987.jpg" }] });

  // ---- Peggy: Bookshop
  moment(M, ruth, d(1992, 4, 4), "Opening Ellison's Books",
    "With money from Grandad's will and a loan the bank manager clearly regretted, Mum took the lease on an old ironmonger's on Otley Road. Dad built every shelf. On the first day she sold eleven books and gave away a twelfth to a boy who couldn't afford it.",
    { milestone: true, place: "Otley Road, Headingley", people: ["Walter Ellison"], images: [{ file: "bookshop-1992.jpg", caption: "Poetry, local history and the fiction nobody else stocked." }] });
  moment(M, sandra, d(1998, null, null, true), "The poetry evenings",
    "On the last Thursday of the month Peggy pushed the tables back and let anyone read. Students, retired miners, a vicar who wrote surprisingly filthy limericks. She kept a jar on the counter for the poets and always topped it up herself when nobody was looking.",
    { place: "Ellison's Books", people: ["Sandra Okafor"] });
  moment(M, ruth, d(2006, 7, 11), "Becoming Gran",
    "Tom was born and Mum was at the hospital before I'd finished ringing round. She brought a sketchbook and drew him asleep, which is still on my wall.",
    { milestone: true, people: ["Tom Ellison"] });
  moment(M, margaret, d(2009, 9), "Closing the shop",
    "The rent doubled and the readers went online. I sold the stock to a man from Hebden Bridge and kept one box of everything I couldn't bear to part with. Walt took the shelves home and built them into the back bedroom, so the shop never really closed; it just moved in with us.",
    { place: "Otley Road, Headingley" });

  // ---- Peggy: Garden years
  moment(M, tom, d(2014, 6), "Gran's garden",
    "Every summer she grows sweet peas up the old bookshop shelving that Grandad put in the yard. She pays me in strawberries to do the watering when she's away, at a rate she sets herself.",
    { place: "Clarendon Road, Leeds", images: [{ file: "garden-2014.jpg", caption: "Sweet peas, June 2014." }] });
  moment(M, ruth, d(2019, 3, 2), "Losing Walt",
    "Dad died at home on a cold, bright Saturday with Mum holding his hand and the radio on. She said afterwards that the house was too quiet, so we took turns staying for a month. She has never once let the radio be switched off since.",
    { milestone: true, people: ["Walter Ellison"] });
  moment(M, tom, d(2019, 9), "The sound of Sandsend",
    "That autumn Gran's knee was too bad for the walk from Whitby, so I went on my own and recorded the sea for her. She plays it in the mornings and says it's the right sea.",
    { place: "Sandsend", audio: { file: "sandsend-waves.wav", caption: "Recorded at Sandsend at low tide.", duration: 22 } });
  moment(M, david, d(2021, 3, 14), "Seventy, and back to Whitby",
    "For her seventieth we took her back to Church Street. The chandlery is a gift shop now. She went in, bought a fridge magnet and told the girl at the till she'd been born upstairs. The girl let her go and look.",
    { place: "Whitby", people: ["Ruth", "David", "Tom"], milestone: true, images: [{ file: "whitby-return-2021.jpg", caption: "Evening light from the East Cliff." }] });

  // ---- Peggy: awaiting review
  moment(M, tom, d(2012, null, null, true), "Gran teaching me to draw",
    "When I was about six she sat me at the kitchen table with one pencil and a potato and told me I wasn't allowed anything else until I'd drawn it properly. It took all afternoon.",
    { status: "pending", people: ["Tom Ellison"] });
  moment(M, margaret, d(1971, 5), "My first painting sold",
    "A woman from Ilkley bought the small harbour painting at the Leeds open exhibition for nine pounds. I wrote to Dad that night and he wrote back that I'd undersold it.",
    { status: "pending", place: "Leeds City Art Gallery" });
  moment(M, tom, d(2010, 2), "Pancakes on Shrove Tuesday",
    "Gran makes pancakes for whoever turns up, and the first one always goes to the bird table.",
    { status: "changes_requested", reviewNote: "Lovely. Gran thinks this started in 2013, not 2010. Could you check and add a photo if you have one?" });

  // ---- Walter
  moment(W, margaret, d(1946, 10, 9), "Born in Barnsley",
    "Walt was born at his grandmother's house in Hoyland, the second of five. He was named after an uncle who'd been lost at Dunkirk.",
    { milestone: true, place: "Hoyland, Barnsley" });
  moment(W, david, d(1964, 7), "One summer down the pit",
    "Dad did a single summer at Elsecar Main to please his father, came up on the last day, washed and announced he was going to be a joiner. Grandad didn't speak to him until Christmas.",
    { place: "Elsecar", images: [{ file: "walter-colliery-1964.jpg", caption: "Hoyland in the evening. Dad said you could taste the coal in the air." }] });
  moment(W, ruth, d(1966, 9), "Apprentice joiner",
    "He came to Leeds with a toolbox his uncle made him and a fiddle he couldn't play yet. Both got used every day for fifty years.",
    { milestone: true, place: "Leeds" });
  moment(W, margaret, d(1972, 2), "The night I met Peggy",
    "We were out of tune and she told me so. I've been trying to get it right ever since.",
    { people: ["Peggy Ellison"], place: "The Brudenell, Leeds" });
  moment(W, david, d(1985, null, null, true), "The workshop",
    "The shed at the bottom of Clarendon Road was Dad's kingdom. Radio Leeds, a kettle and every offcut he'd ever been given. He made my first cricket bat there, and later my daughter's cot.",
    { place: "Clarendon Road, Leeds", images: [{ file: "walter-workshop-1985.jpg", caption: "Sawdust in the window light." }] });
  moment(W, ruth, d(2008, 10), "Retirement, of a sort",
    "He retired on his sixty-second birthday and was back in the workshop by the following Monday, making shelves for anyone who asked.",
    { milestone: true });
  moment(W, tom, d(2018, 9), "Our last walk",
    "Grandad and I walked the canal from Kirkstall to Rodley. He talked about fiddles, wood and Gran the whole way, and stopped at every bench.",
    { people: ["Tom Ellison"], place: "Leeds and Liverpool Canal" });
  moment(W, ruth, d(2019, 3, 2), "Walt",
    "Dad died at home in the house he rebuilt, with Mum beside him and the radio on.",
    { milestone: true, place: "Clarendon Road, Leeds" });

  // Cover photographs
  media.push(
    { id: demoId(4, 100), storyId: M, momentId: null, purpose: "cover", kind: "image", path: "demo/cover-dawn.jpg", mimeType: "image/jpeg", sizeBytes: 300_000, width: 1600, height: 1067, durationSeconds: null, caption: null, position: 0, uploadedBy: ruth, createdAt: now },
    { id: demoId(4, 200), storyId: W, momentId: null, purpose: "cover", kind: "image", path: "demo/walter-cover.jpg", mimeType: "image/jpeg", sizeBytes: 300_000, width: 1600, height: 1067, durationSeconds: null, caption: null, position: 0, uploadedBy: ruth, createdAt: now },
  );

  return { users, stories, members, chapters, moments, media };
}
