import { JSONRepository } from "./JSONRepository";
import { ObjectWithID } from "./Repository";

describe("JSONRepository integration", () => {
  it("handles concurrent reads + writes", async () => {
    const repo = createTestRepo();

    repo.upsave({ a: "asd", b: 123, id: "123" });
    repo.upsave({
      a: "asd3",
      b: 1232,
      id: "1237",
      things: [
        {
          _id: "62dfdf176639687857779743",
          index: 0,
          guid: "0a24b52b-d418-44b7-a20d-0d1ffa6631ff",
          isActive: true,
          balance: "$1,905.53",
          picture: "http://placehold.it/32x32",
          age: 25,
          eyeColor: "green",
          name: "Mai Owens",
          gender: "female",
          company: "XUMONK",
          email: "maiowens@xumonk.com",
          phone: "+1 (834) 585-3351",
          address: "287 Danforth Street, Tuttle, New Mexico, 506",
          about:
            "Id enim et adipisicing mollit voluptate non in enim irure ut. Laborum nulla voluptate cillum mollit officia culpa. Cupidatat quis cupidatat sunt ad qui ad cupidatat dolor Lorem. Laborum ad proident aliqua voluptate. Ex commodo voluptate labore anim consectetur excepteur dolore officia Lorem dolore. Dolore dolore ad qui eiusmod eu nisi ea.\r\n",
          registered: "2015-02-24T11:51:44 -01:00",
          latitude: -8.627592,
          longitude: -78.106567,
          tags: [
            "consequat",
            "irure",
            "excepteur",
            "laborum",
            "et",
            "pariatur",
            "nisi",
          ],
          friends: [
            {
              id: 0,
              name: "Dorsey Hewitt",
            },
            {
              id: 1,
              name: "Mcgee Bean",
            },
            {
              id: 2,
              name: "Thelma Mckay",
            },
          ],
          greeting: "Hello, Mai Owens! You have 2 unread messages.",
          favoriteFruit: "strawberry",
        },
        {
          _id: "62dfdf1794f2c80cd6830a1a",
          index: 1,
          guid: "c9447b70-20db-458a-b406-ed4732dee712",
          isActive: true,
          balance: "$3,640.76",
          picture: "http://placehold.it/32x32",
          age: 30,
          eyeColor: "blue",
          name: "Chandra Hill",
          gender: "female",
          company: "BUZZNESS",
          email: "chandrahill@buzzness.com",
          phone: "+1 (905) 452-2069",
          address: "968 Creamer Street, Klagetoh, New Hampshire, 5245",
          about:
            "Est dolore ex occaecat ad nulla. Cillum ipsum sunt consequat aliqua elit qui dolore dolore irure esse. Id Lorem in nisi aliquip. Proident sint pariatur nulla ad anim.\r\n",
          registered: "2020-03-17T03:19:40 -01:00",
          latitude: 23.718303,
          longitude: -34.496234,
          tags: [
            "do",
            "cupidatat",
            "veniam",
            "exercitation",
            "ea",
            "cillum",
            "exercitation",
          ],
          friends: [
            {
              id: 0,
              name: "Abbott Daniel",
            },
            {
              id: 1,
              name: "Perkins Puckett",
            },
            {
              id: 2,
              name: "Holly Hensley",
            },
          ],
          greeting: "Hello, Chandra Hill! You have 3 unread messages.",
          favoriteFruit: "strawberry",
        },
        {
          _id: "62dfdf17504a76f86df2ec86",
          index: 2,
          guid: "1de15175-9173-45bb-b02b-2bb8aa5d0fee",
          isActive: true,
          balance: "$3,841.50",
          picture: "http://placehold.it/32x32",
          age: 29,
          eyeColor: "brown",
          name: "Janice Stephens",
          gender: "female",
          company: "VERTIDE",
          email: "janicestephens@vertide.com",
          phone: "+1 (986) 493-3241",
          address: "566 Locust Street, Crown, Georgia, 6690",
          about:
            "Veniam est velit veniam mollit ipsum deserunt ex officia labore irure anim esse duis ullamco. Excepteur duis laborum ipsum ex enim dolore amet ea veniam. Sit aliquip ullamco ea eu sunt dolor excepteur et. Incididunt anim magna ullamco occaecat eiusmod cupidatat. Mollit voluptate minim ex mollit mollit cupidatat nostrud laborum aute elit nulla. Lorem occaecat aliquip sunt id commodo id. Sit ullamco laborum nisi qui magna est ex consequat nulla laborum.\r\n",
          registered: "2016-05-30T05:24:16 -02:00",
          latitude: 28.964777,
          longitude: -0.832317,
          tags: ["est", "tempor", "dolor", "nisi", "non", "dolor", "voluptate"],
          friends: [
            {
              id: 0,
              name: "Rena Hutchinson",
            },
            {
              id: 1,
              name: "Estes Gomez",
            },
            {
              id: 2,
              name: "Hoover May",
            },
          ],
          greeting: "Hello, Janice Stephens! You have 5 unread messages.",
          favoriteFruit: "banana",
        },
        {
          _id: "62dfdf17294e266ea98bc104",
          index: 3,
          guid: "7b97f38d-bfd4-4b5f-a06b-cc5a16d2ad01",
          isActive: false,
          balance: "$1,018.67",
          picture: "http://placehold.it/32x32",
          age: 27,
          eyeColor: "green",
          name: "Reeves Saunders",
          gender: "male",
          company: "VALPREAL",
          email: "reevessaunders@valpreal.com",
          phone: "+1 (989) 496-3018",
          address: "461 Crescent Street, Caln, Washington, 7623",
          about:
            "Minim excepteur nulla aliqua sint non Lorem ex dolore est minim minim amet occaecat ipsum. Adipisicing esse esse eu officia mollit do eu ipsum tempor. Adipisicing eiusmod pariatur aliqua cupidatat pariatur tempor excepteur nisi laboris. Laborum nisi est aute incididunt. Consectetur eiusmod sit minim duis officia quis do adipisicing incididunt nulla occaecat aute dolor. Labore aute ipsum dolor dolor laboris nisi mollit in. Enim voluptate dolore sunt et adipisicing anim fugiat magna enim fugiat nulla magna.\r\n",
          registered: "2017-02-01T02:45:53 -01:00",
          latitude: -42.01679,
          longitude: 107.696221,
          tags: ["et", "veniam", "veniam", "dolor", "ipsum", "laboris", "duis"],
          friends: [
            {
              id: 0,
              name: "Mcclain Hodges",
            },
            {
              id: 1,
              name: "Lillian Langley",
            },
            {
              id: 2,
              name: "Patsy Sparks",
            },
          ],
          greeting: "Hello, Reeves Saunders! You have 3 unread messages.",
          favoriteFruit: "apple",
        },
        {
          _id: "62dfdf17934a98f7d0dcc676",
          index: 4,
          guid: "2044be99-c2fc-4703-b349-43a1f14c02da",
          isActive: false,
          balance: "$1,068.09",
          picture: "http://placehold.it/32x32",
          age: 39,
          eyeColor: "blue",
          name: "Moses Fischer",
          gender: "male",
          company: "ULTRASURE",
          email: "mosesfischer@ultrasure.com",
          phone: "+1 (862) 506-3936",
          address: "120 Ridgewood Place, Dana, California, 1971",
          about:
            "Lorem exercitation reprehenderit dolor ex excepteur laborum reprehenderit consectetur. Nisi nisi ea fugiat velit commodo enim ullamco mollit sint aliqua. Officia nostrud amet aliquip nulla excepteur magna elit minim velit laborum ullamco. Magna amet pariatur aute mollit proident esse ea consequat.\r\n",
          registered: "2020-04-11T05:43:39 -02:00",
          latitude: 79.899067,
          longitude: 22.089161,
          tags: ["eu", "eu", "do", "enim", "incididunt", "cupidatat", "qui"],
          friends: [
            {
              id: 0,
              name: "Henry Farley",
            },
            {
              id: 1,
              name: "Lyons Brewer",
            },
            {
              id: 2,
              name: "Iris Collins",
            },
          ],
          greeting: "Hello, Moses Fischer! You have 2 unread messages.",
          favoriteFruit: "banana",
        },
        {
          _id: "62dfdf176a8733b066291c03",
          index: 5,
          guid: "efafb943-8abe-4370-a2ce-ce3fa5d3d0e5",
          isActive: false,
          balance: "$3,842.07",
          picture: "http://placehold.it/32x32",
          age: 24,
          eyeColor: "green",
          name: "Booker Estrada",
          gender: "male",
          company: "KNEEDLES",
          email: "bookerestrada@kneedles.com",
          phone: "+1 (923) 575-3464",
          address: "691 Dakota Place, Konterra, Mississippi, 4539",
          about:
            "In cupidatat labore cupidatat proident ullamco elit minim esse adipisicing pariatur elit cupidatat proident consequat. Nisi labore veniam consectetur esse dolor excepteur sit veniam dolor in eu voluptate nostrud laborum. Ut dolor ex in sint laborum aliquip irure. Deserunt qui laborum laboris proident adipisicing id consectetur id cillum fugiat consectetur.\r\n",
          registered: "2018-12-18T05:40:00 -01:00",
          latitude: 76.484399,
          longitude: -144.456553,
          tags: ["ut", "cillum", "nulla", "commodo", "est", "ipsum", "nulla"],
          friends: [
            {
              id: 0,
              name: "Sheri Waters",
            },
            {
              id: 1,
              name: "Sparks Yates",
            },
            {
              id: 2,
              name: "Lott Frost",
            },
          ],
          greeting: "Hello, Booker Estrada! You have 7 unread messages.",
          favoriteFruit: "apple",
        },
        {
          _id: "62dfdf178775a57afc58d21e",
          index: 6,
          guid: "7f9c498d-6b93-427b-934b-ec0f5e880f5f",
          isActive: false,
          balance: "$2,481.59",
          picture: "http://placehold.it/32x32",
          age: 38,
          eyeColor: "brown",
          name: "Rodriguez Casey",
          gender: "male",
          company: "AQUAMATE",
          email: "rodriguezcasey@aquamate.com",
          phone: "+1 (873) 449-3969",
          address: "909 Bedell Lane, Thynedale, Virginia, 8159",
          about:
            "Ipsum magna fugiat id ex. Cupidatat cupidatat occaecat pariatur in est ea aliquip pariatur ad exercitation magna. Deserunt exercitation ut est voluptate excepteur elit. Ut commodo ut consequat fugiat anim cupidatat. Elit sint sit Lorem anim mollit non aliquip veniam ea aute nostrud esse.\r\n",
          registered: "2017-08-11T11:05:03 -02:00",
          latitude: 84.432224,
          longitude: -133.483429,
          tags: [
            "magna",
            "do",
            "adipisicing",
            "eiusmod",
            "reprehenderit",
            "nisi",
            "ad",
          ],
          friends: [
            {
              id: 0,
              name: "Conner Jensen",
            },
            {
              id: 1,
              name: "Audrey Cherry",
            },
            {
              id: 2,
              name: "Eleanor Kirk",
            },
          ],
          greeting: "Hello, Rodriguez Casey! You have 9 unread messages.",
          favoriteFruit: "apple",
        },
      ],
    });
    repo.upsave({ a: "asd2", b: 1232, id: "1232" });
    repo.upsave({ a: "asd3", b: 1232, id: "1234" });
    repo.upsave({ a: "asd3", b: 1232, id: "1235" });
    repo.upsave({ a: "asd3", b: 1232, id: "1236" });

    repo.upsave({ a: "asdlol", b: 123, id: "123" });

    expect(await repo.get("123")).toEqual({ a: "asdlol", b: 123, id: "123" });
  });
});

function createTestRepo(): JSONRepository<TestModel> {
  return new JSONRepository<TestModel>({ name: "TestModel" });
}

interface TestModel extends ObjectWithID {
  a: string;
  b: number;
  [k: string]: any;
}
