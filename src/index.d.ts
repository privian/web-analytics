interface Navigator {
  userAgentData: {
    brands: {
      brand: string;
      version: string;
    }[];
    mobile: boolean;
    platform: string;
  };
}
