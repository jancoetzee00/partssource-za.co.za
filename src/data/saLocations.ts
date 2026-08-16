/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProvinceData {
  name: string;
  code: string;
  majorTowns: string[];
}

export const SA_PROVINCES: ProvinceData[] = [
  {
    name: "Gauteng",
    code: "GP",
    majorTowns: [
      "Johannesburg",
      "Pretoria",
      "Centurion",
      "Midrand",
      "Kempton Park",
      "Germiston",
      "Benoni",
      "Boksburg",
      "Sandton",
      "Randburg",
      "Roodepoort",
      "Springs",
      "Vanderbijlpark",
      "Krugersdorp",
      "Alberton",
      "Soweto",
      "Brakpan",
      "Heidelberg"
    ]
  },
  {
    name: "Western Cape",
    code: "WC",
    majorTowns: [
      "Cape Town",
      "Bellville",
      "Paarl",
      "Stellenbosch",
      "George",
      "Mossel Bay",
      "Worcester",
      "Somerset West",
      "Brackenfell",
      "Knysna",
      "Hermanus",
      "Malmesbury",
      "Vredenburg"
    ]
  },
  {
    name: "KwaZulu-Natal",
    code: "KZN",
    majorTowns: [
      "Durban",
      "Pinetown",
      "Pietermaritzburg",
      "Umhlanga",
      "Richards Bay",
      "Newcastle",
      "Port Shepstone",
      "Ladysmith",
      "Ballito",
      "Empangeni",
      "KwaDukuza (Stanger)"
    ]
  },
  {
    name: "Eastern Cape",
    code: "EC",
    majorTowns: [
      "Gqeberha (Port Elizabeth)",
      "East London",
      "Uitenhage (Kariega)",
      "Mthatha",
      "Makhanda (Grahamstown)",
      "Queenstown (Komani)",
      "Jeffreys Bay",
      "Cradock"
    ]
  },
  {
    name: "Free State",
    code: "FS",
    majorTowns: [
      "Bloemfontein",
      "Welkom",
      "Sasolburg",
      "Kroonstad",
      "Bethlehem",
      "Harrismith",
      "Parys",
      "Phuthaditjhaba"
    ]
  },
  {
    name: "Mpumalanga",
    code: "MP",
    majorTowns: [
      "Mbombela (Nelspruit)",
      "Witbank (eMalahleni)",
      "Middelburg",
      "Secunda",
      "Standerton",
      "Barberton",
      "Ermelo",
      "White River"
    ]
  },
  {
    name: "Limpopo",
    code: "LP",
    majorTowns: [
      "Polokwane",
      "Tzaneen",
      "Mokopane",
      "Thohoyandou",
      "Bela-Bela",
      "Phalaborwa",
      "Lephalale",
      "Musina",
      "Makhado (Louis Trichardt)"
    ]
  },
  {
    name: "North West",
    code: "NW",
    majorTowns: [
      "Rustenburg",
      "Potchefstroom",
      "Klerksdorp",
      "Brits",
      "Mahikeng",
      "Lichtenburg",
      "Vryburg",
      "Orkney"
    ]
  },
  {
    name: "Northern Cape",
    code: "NC",
    majorTowns: [
      "Kimberley",
      "Upington",
      "Springbok",
      "Kuruman",
      "De Aar",
      "Kathu"
    ]
  }
];

export const ALL_PROVINCE_NAMES = SA_PROVINCES.map((p) => p.name);

export function getTownsForProvince(provinceName: string | null | undefined): string[] {
  if (!provinceName) {
    // Return all distinct top towns
    const all = SA_PROVINCES.flatMap((p) => p.majorTowns);
    return Array.from(new Set(all)).sort();
  }
  const found = SA_PROVINCES.find((p) => p.name.toLowerCase() === provinceName.toLowerCase());
  return found ? found.majorTowns : [];
}

/**
 * Checks if a location string matches a given province or town
 */
export function matchesLocation(
  locationString: string | undefined | null,
  province: string | null | undefined,
  town: string | null | undefined
): boolean {
  if (!locationString) return !province && !town;
  const loc = locationString.toLowerCase();

  if (province) {
    const provLower = province.toLowerCase();
    const provData = SA_PROVINCES.find((p) => p.name.toLowerCase() === provLower);
    const provCode = provData ? provData.code.toLowerCase() : "";

    const provMatch = loc.includes(provLower) || (provCode && loc.includes(`(${provCode})`)) || (provCode && loc.includes(`, ${provCode}`));
    if (!provMatch) {
      // Also check if any town of this province is in the location string
      const townsInProv = getTownsForProvince(province);
      const anyTownMatches = townsInProv.some(t => {
        // Strip parentheses e.g. "Gqeberha (Port Elizabeth)" -> check "gqeberha" or "port elizabeth"
        const cleanT = t.toLowerCase().replace(/[()]/g, " ");
        return cleanT.split(/\s+/).some(part => part.length > 3 && loc.includes(part));
      });
      if (!anyTownMatches) return false;
    }
  }

  if (town) {
    const townLower = town.toLowerCase();
    // Handle variants like "Gqeberha (Port Elizabeth)"
    const parts = townLower.replace(/[()]/g, " ").split(/\s+/).filter(p => p.length > 3);
    const townMatch = loc.includes(townLower) || parts.some(p => loc.includes(p));
    if (!townMatch) return false;
  }

  return true;
}
