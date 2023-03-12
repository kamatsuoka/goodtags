import Tag from "../lib/models/Tag"

// utilities for displaying formatted tag details

const arranger = (tag: Tag) => tag.arranger || "anon"
const posted = (tag: Tag) => new Date(tag.posted).toISOString().split("T")[0]

export {arranger, posted}
