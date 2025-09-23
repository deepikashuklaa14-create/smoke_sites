module.exports = [
  {
    site: "https://www.lsbf.edu.sg/",
    pages: [
      { url: "/", expectedTitle: "Where Ambition Meets Opportunity" },
      { url: "/programmes", expectedTitle: "Find the right programme" },
      { url: "/programmes/diploma", expectedTitle: "Diploma Programmes" },  // fixed double slash
      { url: "/programmes/undergraduate", expectedTitle: "Undergraduate | Bachelor's Degree" },
      { url: "/programmes/postgraduate", expectedTitle: "Postgraduate | Master's Degree" },
      { url: "/contact-us", expectedTitle: "London School of Business and Finance Singapore Campus | LSBF" },
      { url: "/programmes/languages", expectedTitle: "Language Courses" },
      { url: "/programmes/undergraduate", expectedTitle: "Undergraduate | Bachelor's Degree" },
      { url: "/programmes/undergraduate", expectedTitle: "Undergraduate | Bachelor's Degree" },
      { url: "/programmes/undergraduate", expectedTitle: "Undergraduate | Bachelor's Degree" },
      { url: "/programmes/undergraduate", expectedTitle: "Undergraduate | Bachelor's Degree" },
      { url: "/programmes/undergraduate", expectedTitle: "Undergraduate | Bachelor's Degree" },
      { url: "/programmes/undergraduate", expectedTitle: "Undergraduate | Bachelor's Degree" },

      

      // add all pages for site1
    ],
  },
  // Uncomment and add other sites as needed:
  // {
  //   site: "https://site2.com",
  //   pages: [
  //     { url: "/", expectedTitle: "Welcome to Site 2" },
  //     { url: "/contact", expectedTitle: "Contact - Site 2" },
  //     // add pages for site2
  //   ],
  // },
  // Add all 10 sites similarly
];
