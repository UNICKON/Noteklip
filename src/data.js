export const data = {
  authors: {
    "James Clear": { books: ["atomic-habits"] },
    "Brandon Sanderson": { books: ["the-way-of-kings", "mistborn","the-way-of-kingsthe-way-of-kingsthe-way-of-kingsthe-way-of-kingsthe-way-of-kingsthe-way-of-kingsthe-way-of-kingsthe-way-of-kingsthe-way-of-kingsthe-way-of-kings"] },
    "Andrew Hunt": { books: ["pragmatic-programmer"] },
  },
  books: {
    "atomic-habits": {
      id: "atomic-habits",
      title: "Atomic Habits",
      author: "James Clear",
      coverUrl: "https://m.media-amazon.com/images/I/81wgcld4wxL._AC_UF1000,1000_QL80_.jpg",
      highlightsCount: 270,
      lastRead: "Dec 20, 2023",
      highlights: [
        { id: 1, text: "The purpose of a habit is to solve the problems of life with as little energy and effort as possible.", location: "124", date: "Dec 20, 2023", note: "The purpose of a habit is to solve the problems of life with as little energy and effort as possible.The purpose of a habit is to solve the problems of life with as little energy and effort as possible.The purpose of a habit is to solve the problems of life with as little energy and effort as possible.The purpose of a habit is to solve the problems of life with as little energy and effort as possible." },
        { id: 2, text: "You do not rise to the level of your goals. You fall to the level of your systems.", location: "250", date: "Dec 21, 2023", note: null },
        { id: 3, text: "Every action you take is a vote for the type of person you wish to become.", location: "312", date: "Dec 22, 2023", note: "So powerful!" },
      ],
    },
    "the-way-of-kings": { 
      id: "the-way-of-kings", 
      title: "The Way of Kings", 
      author: "Brandon Sanderson",
      coverUrl: null,
      highlightsCount: 240,       
      highlights: [
        { id: 1, text: "The purpose of a habit is to solve the problems of life with as little energy and effort as possible.The purpose of a habit is to solve the problems of life with as little energy and effort as possible.The purpose of a habit is to solve the problems of life with as little energy and effort as possible.The purpose of a habit is to solve the problems of life with as little energy and effort as possible.The purpose of a habit is to solve the problems of life with as little energy and effort as possible.The purpose of a habit is to solve the problems of life with as little energy and effort as possible.", location: "124", date: "Dec 20, 2023", note: "The purpose of a habit is to solve the problems of life with as little energy and effort as possible.The purpose of a habit is to solve the problems of life with as little energy and effort as possible.The purpose of a habit is to solve the problems of life with as little energy and effort as possible.The purpose of a habit is to solve the problems of life with as little energy and effort as possible." },
        { id: 2, text: "You do not rise to the level of your goals. You fall to the level of your systems.", location: "250", date: "Dec 21, 2023", note: null },
        { id: 3, text: "Every action you take is a vote for the type of person you wish to become.", location: "312", date: "Dec 22, 2023", note: "So powerful!" },
      ],},
    "mistborn": { 
      id: "mistborn", 
      title: "Mistborn: The Final Empire", 
      author: "Brandon Sanderson",
      coverUrl: null,
      highlightsCount: 220, 
      highlights: [] 
    },
    "pragmatic-programmer": { 
      id: "pragmatic-programmer", 
      title: "The Pragmatic Programmer", 
      author: "Andrew Hunt",
      coverUrl: "https://m.media-amazon.com/images/I/518KfvKdKfL._AC_UF1000,1000_QL80_.jpg",
      highlightsCount: 120, 
      highlights: [] 
    },
    "the-way-of-kingsthe-way-of-kingsthe-way-of-kingsthe-way-of-kingsthe-way-of-kingsthe-way-of-kingsthe-way-of-kingsthe-way-of-kingsthe-way-of-kingsthe-way-of-kings":
     { 
       id: "mistborn1", 
       title: "Mistborn1: The Final Empiremistbornmistbornmistbornmistbornmistbornmistbornmistbornmistbornmistbornmistbornmistbornmistborn", 
       author: "Brandon Sanderson",
       coverUrl: "https://m.media-amazon.com/images/I/51R-d0H-xyL._AC_UF1000,1000_QL80_.jpg",
       highlightsCount: 220, 
       highlights: [] 
     },
  },
  getAllHighlights: function() {
    let all = [];
    for (const bookId in this.books) {
      const book = this.books[bookId];
      book.highlights.forEach(h => {
        all.push({ ...h, bookTitle: book.title, author: book.author, bookId: book.id});
      });
    }
    return all;
  }
};
