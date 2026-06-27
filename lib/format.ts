export function formatCountry(country: string) {
  const value = country.trim();

  const upperCaseCountries = ["UAE", "USA", "UK", "EU"];

  if (upperCaseCountries.includes(value.toUpperCase())) {
    return value.toUpperCase();
  }

  return value
    .toLowerCase()
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}