import GLightbox from "glightbox";
import "glightbox/dist/css/glightbox.min.css";

export function initKazuLightbox() {
  GLightbox({
    selector: "a.glightbox",
    touchNavigation: true,
    loop: true,
    zoomable: true,
    openEffect: "zoom",
    closeEffect: "fade",
  });
}
