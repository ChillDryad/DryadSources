import {
  CatalogRating,
  Chapter,
  ChapterData,
  Content,
  ContentSource,
  DirectoryConfig,
  DirectoryRequest,
  Form,
  PageLink,
  PageLinkResolver,
  PageSection,
  PagedResult,
  Property,
  RunnerInfo,
  SectionStyle,
} from "@suwatte/daisuke";
import { LANG_TAGS, SORTERS } from "./constants";
import { Controller } from "./controller";

export class Target implements ContentSource {
  info: RunnerInfo = {
    id: "to.bato",
    name: "Bato",
    version: 0.5,
    website: "https://bato.to",
    supportedLanguages: LANG_TAGS.map((l) => l.id),
    thumbnail: "bato.png",
    minSupportedAppVersion: "5.0",
    rating: CatalogRating.MIXED,
  };

  private controller = new Controller();
  getContent(contentId: string): Promise<Content> {
    return this.controller.getContent(contentId);
  }
  getChapters(contentId: string): Promise<Chapter[]> {
    return this.controller.getChapters(contentId);
  }
  getChapterData(contentId: string, chapterId: string): Promise<ChapterData> {
    return this.controller.getChapterData(chapterId);
  }

  async getTags?(): Promise<Property[]> {
    return this.controller.getProperties();
  }

  async getPreferenceMenu(): Promise<Form> {
    return this.controller.getPreferences();
  }

  getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    console.log(request);
    if (!request.page && !request.query) {
    }
    return this.controller.getSearchResults(request);
  }

  PageLinkResolver: PageLinkResolver = {
    // @ts-ignore: We _really_ don't need to promise this here.
    getSectionsForPage: (page: PageLink): PageSection[] => {
      if (page.id === "home") {
        const sections: PageSection[] = [
          {
            id: "popular",
            title: "Popular Titles",
            style: SectionStyle.INFO,
          },
          {
            id: "latest",
            title: "latest Titles",
            style: SectionStyle.DEFAULT,
          },
        ];
        return sections;
      }
      throw new Error(`I don't know how you got here.`);
    },

    resolvePageSections: (link: PageLink, sectionId: string) => {
      if (link.id === "home")
        return this.controller.resolveHomeSections(link, sectionId);
      else throw new Error(`Something bad happened when I loaded ${link.id}`);
    },
  };

  // getSectionsForPage = (page: PageLink) => {
  //   return this.controller.getHomeSections(page);
  // };

  // resolvePageSections = (link: PageLink, sectionId: string) => {
  //   if (link.id === "home")
  //     return this.controller.resolveHomeSections(link, sectionId);
  //   else throw new Error(`Something bad happened when I loaded ${link.id}`);
  // };

  async getDirectoryConfig(
    _configID?: string | undefined
  ): Promise<DirectoryConfig> {
    return {
      filters: this.controller.getFilters(),
      sort: {
        options: SORTERS,
        canChangeOrder: false,
      },
    };
  }
}
