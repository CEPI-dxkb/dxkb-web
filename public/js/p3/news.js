const newsArticles = [
    {
        title: "Mpox 2024",
        link: "/outbreaks/Mpox/#view_tab=overview",
        image: "https://www.bv-brc.org/api/content/images/outbreaks/mpox/poxviridae_virion_image_single.png",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
        title: "Influenza H5N1 2024",
        link: "/outbreaks/H5N1/#view_tab=overview",
        image: "https://www.bv-brc.org/api/content/images/outbreaks/H5N1/influenza_virion_image.png",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
        title: "Temp Title 1",
        link: "https://unsplash.com/photos/purple-cells-L7en7Lb-Ovc",
        image: "https://images.unsplash.com/photo-1576086213369-97a306d36557",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
        title: "Temp Title 2",
        link: "/outbreaks/H5N1/#view_tab=overview",
        image: "https://images.unsplash.com/photo-1475906089153-644d9452ce87",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
        title: "Temp Title 3 extra long title",
        link: "/outbreaks/Mpox/#view_tab=overview",
        image: "https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
        title: "Temp Title 4",
        link: "/outbreaks/H5N1/#view_tab=overview",
        image: "https://images.unsplash.com/photo-1595131838595-3154b9f4450b",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
        title: "Temp Title 5",
        link: "/outbreaks/Mpox/#view_tab=overview",
        image: "https://images.unsplash.com/photo-1579165466741-7f35e4755660",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    }
];

let currentIndex = 0;
const articlesToShow = 4;

function renderArticles() {
    const outbreaksContainer = document.querySelector('.outbreaks');
    outbreaksContainer.innerHTML = ''; // Clear existing articles

    for (let i = 0; i < articlesToShow; i++) {
        const articleIndex = (currentIndex + i) % newsArticles.length;
        const article = newsArticles[articleIndex];

        const articleDiv = document.createElement('div');
        articleDiv.className = 'bv-brc-bottom-left card';
        articleDiv.style.flexDirection = 'column';
        articleDiv.innerHTML = `
            <div class="content-image" style="width: 200px; height: 200px;">
                <img src="${article.image}" alt="${article.title}" style="">
            </div>
            <div class="content" style="width: fit-content; height: 200px;">
                <div class="content-description">
                    <h2><a href="${article.link}">${article.title}</a></h2>
                    <p style="text-align: left; width: fit-content;">${article.description}</p>
                </div>
            </div>
        `;
        outbreaksContainer.appendChild(articleDiv);
    }
}

function moveCarousel(direction) {
    currentIndex = (currentIndex + direction + newsArticles.length) % newsArticles.length;
    renderArticles();
}

// Initial render
renderArticles();