import Tag from "../lib/models/Tag"

// utilities for displaying formatted tag details

const arranger = (tag: Tag) => tag.arranger || "anon"

export {arranger}
