// import {
//   type PageLinkResolver,
//   type PageLink,
//   SectionStyle,
//   PageSection
// } from "@suwatte/daisuke";

// export const BatoPageLinkResolver: PageLinkResolver = {
//   // @ts-ignore: We _really_ don't need to promise this here.
//   getSectionsForPage: (page: PageLink):PageSection[] => {
//     if (page.id === "home") {
//       const sections: PageSection[] = [
//         {
//           id: "popular",
//           title: "Popular Titles",
//           style: SectionStyle.INFO,
//         },
//         {
//           id: "latest",
//           title: "latest Titles",
//           style: SectionStyle.DEFAULT,
//         },
//       ];
//       return sections
//     }
//     throw new Error(`I don't know how you got here.`);
//   },

//   resolvePageSections: (link: PageLink, sectionId: string) => {
//     if (link.id === "home")
//       return this.controller.resolveHomeSections(link, sectionId);
//     else throw new Error(`Something bad happened when I loaded ${link.id}`);
//   }
// }
