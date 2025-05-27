# DrakeWorks Blog and Portfolio

A personal blog and portfolio site built with Jekyll. This site features blog posts, a video section, and a gallery, showcasing various projects and content.

## Technologies Used

- Jekyll
- HTML
- CSS
- JavaScript

## Setup

1.  **Clone this repository:**
    ```bash
    git clone https://github.com/drakeworks/drakeworks.github.io.git
    cd drakeworks.github.io
    ```

2.  **Install Jekyll and Bundler** (if you haven't already):
    ```bash
    # macOS
    brew install ruby
    gem install bundler

    # Ubuntu/Debian
    sudo apt-get install ruby-full
    gem install bundler
    ```

3.  **Install dependencies:**
    ```bash
    bundle install
    ```

4.  **Serve the site locally:**
    ```bash
    bundle exec jekyll serve
    ```

5.  Open your browser and visit `http://localhost:4000`

## Project Structure

- `_config.yml`: Site configuration.
- `_data/`: Data files for navigation and social links.
- `_includes/`: Reusable HTML components (header, footer, sections, sidebar).
- `_layouts/`: Layouts for pages and posts.
- `_posts/`: Markdown files for blog posts.
- `_videos/`: Markdown files for video posts.
- `css/`: Custom CSS files (`main.css`).
- `js/`: JavaScript files.
- `images/`: Site images.
- `index.html`: The homepage.

## Customization

- Site settings: `_config.yml`
- Navigation: `_data/navigation.yml`
- Social links: `_data/social.yml`
- Styling: `css/main.css`
- Layouts: `_layouts/`
- Components: `_includes/`

## Content

- Blog posts are located in `_posts/`.
- Video posts are located in `_videos/`.
- Gallery images can be managed in `images/gallery/` and potentially configured in includes.

## Contributing

If you'd like to contribute, please follow the standard GitHub flow:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Make your changes and commit them with clear messages.
4. Push your branch and open a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Credits

This site uses the following resources:

- [Font Awesome](https://fontawesome.com/) for icons
- [Splide](https://splidejs.com/) for carousels
- [Google Fonts](https://fonts.google.com/) for typography 