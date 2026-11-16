// Lessons written from NHIE Volume 2, chapter 5 (Insulation and Ventilation). Page numbers are approximate.
NHIE.lessons("insulation", [
{ t: "Scope, air tightness and the words", p: "266–272",
  goal: "Know what is inspected and the terms R-value, U-value, vapor retarder and air barrier.",
  teach: [
    "# Scope",
    "- Insulation and ventilation are means to comfort, energy efficiency and moisture control.",
    "- In scope: visible insulation and vapor retarders in unfinished spaces, ventilation of attics and foundation areas, kitchen, bath and laundry exhaust. Report missing insulation. Measuring insulation is not required.",
    "# Air tightness",
    "- Old houses leaked plenty of air. New houses must be air sealed to 5 air changes per hour or less (3 or less in climate zones 3 to 8). At 5 or fewer, codes require mechanical outside air.",
    "# Terms",
    "- R-value: resistance to heat flow; higher is better. U-value: heat transfer; lower is better. R = 1/U.",
    "- Wood is a poor insulator: a 2x4 is about R-4.4, a 2x6 about R-6.9 (thermal bridging).",
    "- Basement wall: at least 50% below grade, enclosing conditioned space.",
    "- Vapor retarder classes: Class I 0.1 perm or less (polyethylene, foil). Class II 0.1 to 1.0 perm (kraft facing). Class III 1.0 to 10 perm (latex paint).",
    "- Brick, wood and vinyl siding, #15 felt and fibrous insulation let vapor pass. Most house wraps let vapor out but stop liquid water.",
    "# Climate zones",
    "- Zones 1 (hottest) to 8 (coldest), plus moist (A), dry (B) and marine (C). Most of the continental U.S. is zones 2 to 7.",
    "- Walls: a vapor retarder is not required or recommended in zones 1 to 3. Class I or II on the inside in zones 5 to 8 and Marine 4 (some exceptions allow Class III).",
    "- Attics: no vapor retarder needed if well ventilated; in zones 6 to 8 one on the attic floor allows the reduced 1:300 vent ratio.",
    "! R up = better. U down = better. Vapor retarder on the warm-in-winter side, cold zones only."
  ],
  cards: [
    ["R-value vs U-value", "R: resistance to heat flow, higher is better. U: heat transfer, lower is better. R = 1/U."],
    ["Vapor retarder classes", "Class I: 0.1 perm or less (poly, foil). Class II: 0.1 to 1.0 (kraft). Class III: 1.0 to 10 (latex paint)."],
    ["Air tightness of new houses", "5 air changes per hour or less (3 or less in zones 3 to 8); mechanical ventilation required."],
    ["R-value of a 2x4 and 2x6", "About R-4.4 and R-6.9."],
    ["Where are wall vapor retarders required?", "Interior side in climate zones 5 to 8 and Marine 4; not recommended in zones 1 to 3."],
    ["Climate zones", "1 (hottest) to 8 (coldest), with A moist, B dry, C marine."],
    ["Is measuring insulation required?", "No; report type, approximate amount and absence where seen."]
  ],
  qs: [
    ["Which material is a Class I vapor retarder?", ["Polyethylene sheet", "Kraft paper facing", "Latex paint", "Brick"], "Class I is 0.1 perm or less."],
    ["A window has a U-value of 0.30 and another 0.50. Which insulates better?", ["The 0.30 window", "The 0.50 window", "They are equal", "Cannot tell"], "Lower U is better."],
    ["In climate zone 2 (hot, humid), should poly be put on the inside of walls?", ["No; wall vapor retarders are not recommended in zones 1 to 3", "Yes, always", "Yes, two layers", "Only in bedrooms"], "It can trap moisture from outside."],
    ["Why do studs lower a wall's overall R-value?", ["Wood conducts more heat than the insulation (thermal bridging)", "They hold moisture", "They block air", "They are painted"], "A 2x4 is only about R-4.4."]
  ] },

{ t: "How moisture moves: pressures and holes", p: "272–279",
  goal: "Explain air leakage, vapor drive and condensation with real examples.",
  teach: [
    "- Think in pressures and holes. Air and water vapor do not move without a force pushing them, and they need a path.",
    "- Forces: wind, stack effect (warm air rises and leaks out up high, pulling cold air in low), exhaust fans and duct leaks, and vapor pressure (moist to dry).",
    "- Air leaks carry far more moisture than vapor passing through materials. Sealing holes matters most.",
    "- Warm moist air hitting a surface colder than its dew point condenses.",
    "# Book example: attic mold (cold, moist climate 5A in winter)",
    "- No bath or kitchen fans to the outside, a well-insulated attic that stays cold, and leaks around old recessed lights and chases. Warm moist air rises into the attic and condenses on the cold sheathing: mold and rot.",
    "# Book example: crawl space mold (warm, moist climate 3A in summer)",
    "- Humid outside air enters a vented crawl space and meets the cool, air conditioned floor. Insulation with a vapor retarder facing up (toward the house) traps condensation in the batts and wood: mold and rot.",
    "- Lesson: a moisture solution for one climate can cause damage in another.",
    "! Air leaks move most of the moisture. Fix the holes and the pressures."
  ],
  cards: [
    ["Pressures and holes", "Air and moisture move only when a force (wind, stack effect, fans, vapor pressure) pushes them through a path."],
    ["Stack effect", "Warm air rises and leaks out high, pulling cold air in low."],
    ["Air leakage vs vapor diffusion", "Air leaks carry far more moisture than diffusion through materials."],
    ["Dew point", "The temperature at which water vapor condenses into liquid."],
    ["Common cause of winter attic mold", "Moist house air leaking into a cold attic through bypasses, often with bath fans not vented outside."]
  ],
  qs: [
    ["Frost and dark stains cover the underside of the roof sheathing in winter. What is the likely cause?", ["Warm moist house air leaking into a cold attic", "Too much attic ventilation", "A new roof", "Good insulation"], "Look for bypasses and fans venting into the attic."],
    ["Which moves more moisture into wall and attic spaces?", ["Air leakage", "Vapor diffusion", "They are equal", "Neither"], "Seal air leaks first."],
    ["In a hot humid climate, crawl space batts with the vapor retarder facing the floor above are wet and moldy. Why?", ["Humid crawl space air condenses against the cool floor side", "The batts are too thin", "Too little humidity", "Too much heat from below"], "Climate determines where vapor retarders belong."]
  ] },

{ t: "Insulation types and defects", p: "279–290",
  goal: "Identify insulation types, their R-values, and the defects to report.",
  teach: [
    "# Batts",
    "- Fiberglass R-3 (standard) to R-4 (high density) per inch; mineral wool and cotton about R-3.7; plastic about R-4. Unfaced batts are not an air barrier or vapor retarder.",
    "# Loose fill",
    "- Low density fiberglass about R-2.2 per inch; high density R-2.7; cellulose R-3.5; mineral wool R-3.1.",
    "- Cellulose and mineral wool are heavy: watch for sagging drywall on 24 inch framing, especially when adding insulation over trusses.",
    "# Rigid sheets",
    "- EPS (white beads) about R-4 per inch, Class III. XPS (blue, pink, green) about R-5. Polyiso and polyurethane (yellow or orange, often foil faced) start near R-8 and lose some over time; foil faced = Class I.",
    "# Spray foam",
    "- Open cell (light, not a vapor retarder, lets liquid water through) and closed cell (heavier, a vapor retarder at thickness, blocks liquid water). Both are air barriers. Foam needs an ignition or thermal barrier cover in most places.",
    "# Others",
    "- Vermiculite (gray-gold flakes, brand Zonolite, mostly before 1950): may contain asbestos. Do not disturb; recommend testing.",
    "- Perlite: white gravel-like, about R-2.4, not an asbestos concern.",
    "- Urea-formaldehyde foam (UFFI): 1970s to early 1980s wall foam, stopped because of formaldehyde off-gassing.",
    "# Report these",
    "- Less than current standards (only a defect in newer houses; you may recommend upgrading).",
    "- Loose fill shallower than the card says (sometimes piled up at the depth markers).",
    "- Missing insulation: attic kneewalls, skylight shafts, where trades disturbed it.",
    "- Widely compressed insulation; batts hanging in crawl spaces; gaps where floor trusses leave it away from the air barrier.",
    "- Insulation blocking eave vents (baffles should leave at least 1 inch of air space).",
    "- Not cut around wires, boxes and pipes.",
    "- Chases not fireblocked or insulated.",
    "- Insulation touching vents, chimneys or non-IC recessed lights (shields required).",
    "- Vapor retarder facing the cold side; more than one vapor retarder; exposed kraft facing (fire hazard).",
    "! Fiberglass batt R-3 to R-4 per inch, cellulose R-3.5, XPS R-5, closed cell foam highest."
  ],
  cards: [
    ["Fiberglass batt R-value per inch", "About R-3 standard to R-4 high density."],
    ["Cellulose loose fill R-value per inch", "About R-3.5."],
    ["EPS vs XPS rigid foam", "EPS (white beads) about R-4 per inch. XPS (colored) about R-5."],
    ["Open vs closed cell spray foam", "Both air barriers. Open cell: not a vapor retarder, passes liquid water. Closed cell: vapor retarder, blocks liquid water."],
    ["Vermiculite insulation", "Gray-gold flakes (Zonolite), mostly pre-1950; may contain asbestos; do not disturb; recommend testing."],
    ["UFFI", "Urea-formaldehyde foam insulation from the 1970s and early 1980s; discontinued due to formaldehyde off-gassing."],
    ["Insulation baffle air space", "At least 1 inch at the eaves."],
    ["Two vapor retarders in one assembly", "A defect; moisture can be trapped between them."]
  ],
  qs: [
    ["Gray-gold pebble-like insulation is found in an attic. What should be reported?", ["Possible vermiculite with asbestos; do not disturb; recommend testing", "It is perlite and safe", "It is cellulose", "Nothing"], "Inspectors do not test materials."],
    ["Blown insulation is 6 inches deep in most places but 12 inches at each depth ruler. What does this suggest?", ["Insulation was piled at the markers; actual depth is less than stated", "Correct installation", "Settling", "Good coverage"], "A known trick or sloppy install."],
    ["Kraft-faced batts are exposed on a basement wall with no covering. What is the concern?", ["Exposed kraft facing is a fire hazard", "It looks bad", "It is too thick", "Nothing"], "Facings must be covered by an approved material."],
    ["Insulation is packed tightly against a metal gas vent in the attic with no shield. What is reported?", ["Fire hazard; an insulation shield is needed", "Good insulation", "Nothing", "Moisture issue only"], "Heat-producing components need clearance."]
  ] },

{ t: "House wrap, radiant barriers and windows", p: "290–296",
  goal: "Know WRB types, what radiant barriers do, and window R-values.",
  teach: [
    "# Water-resistive barriers",
    "- Original: asphalt-saturated kraft (Grade D paper) and #15 felt. Lapped shingle-style (upper over lower), seams lapped.",
    "- Newer: house wraps (since the 1970s, common last 15 to 20 years), liquid coatings, sheathing with a built-in WRB (taped seams). Follow the maker.",
    "- WRBs can help air sealing when installed and taped correctly.",
    "# Radiant barriers",
    "- Not insulation; no R-value. They reflect radiant heat. Most effective in zones 1 and 2 (Deep South, Desert Southwest) with lots of sun on the roof.",
    "# Fenestration (windows, doors, skylights)",
    "- Single pane wood window about R-1; double pane about R-1.8; the best triple pane gas-filled only about R-5 or so. Glass is the weak spot.",
    "- Minimum fenestration R about 2.5 (warm) to 3.1 (cold climates). Judging window R-values and Low-E coatings is out of scope.",
    "! A radiant barrier has no R-value. A double pane window is only about R-1.8."
  ],
  cards: [
    ["Grade D paper and #15 felt", "Traditional asphalt-saturated WRBs, lapped shingle fashion."],
    ["Radiant barrier", "Reflects radiant heat; has no R-value; most useful in climate zones 1 and 2."],
    ["Single vs double pane window R-value", "About R-1 vs about R-1.8."],
    ["Are window R-values and Low-E coatings inspected?", "No; determining them is out of scope."]
  ],
  qs: [
    ["A client asks how much R-value the foil radiant barrier in the attic adds. What is correct?", ["None; it reflects radiant heat but is not insulation", "R-30", "R-5", "R-1 per layer"], "It works by reflection."],
    ["House wrap on a wall is installed with the upper sheet tucked under the lower sheet. What is the problem?", ["It should lap shingle fashion so water runs over the lower layer", "Nothing", "It should be vertical", "It needs paint"], "Reverse laps send water behind the wrap."]
  ] },

{ t: "Whole-house ventilation", p: "296–305",
  goal: "Know HRVs, ERVs, whole-house fans and intake and exhaust clearances.",
  teach: [
    "- Tight houses need planned outside air.",
    "- Exhaust-only (bath fans run continuously), supply-only (an outdoor air duct to the furnace return), and balanced systems.",
    "# HRV and ERV",
    "- Bring in fresh air and exhaust stale air through a heat exchanger. HRV (heat recovery) transfers heat; ERV (energy recovery) transfers heat and moisture. HRVs make condensate.",
    "- May have their own ducts or share HVAC ducts.",
    "# Clearances",
    "- Air intake: at least 10 feet horizontally from, or 3 feet below, chimneys, appliance vents, plumbing vents and exhausts; at least 6 feet from the HRV/ERV's own exhaust.",
    "- Exhaust: at least 3 feet from doors, operable windows and the property line; 10 feet horizontally from, or 3 feet above, air intakes.",
    "- Openings screened (except dryers), with dampers.",
    "# HRV/ERV defects",
    "- Openings too close, unscreened or blocked; no filter; crushed ducts; dirty filters and cores (maintenance).",
    "# Whole-house fans",
    "- Large ceiling fan (24 to 36 inches) in a central hall; louvers open; pulls air in through open windows and pushes it out the attic. Needs a lot of attic vent area. Open windows or it can backdraft fuel appliances.",
    "- Defects: does not run, louvers stuck or damaged, worn belt, no winter cover, too little attic venting.",
    "! Intake 10 feet from vents and exhausts. Exhaust 3 feet from windows and doors."
  ],
  cards: [
    ["HRV vs ERV", "HRV transfers heat only (makes condensate); ERV transfers heat and moisture."],
    ["Mechanical air intake clearance", "At least 10 feet horizontally from, or 3 feet below, vents, chimneys and exhausts."],
    ["Exhaust termination clearance", "At least 3 feet from doors, operable windows and the property line."],
    ["Whole-house fan", "Large ceiling fan that pulls air through open windows and exhausts it through the attic; needs ample attic ventilation."],
    ["Screen opening size for intake and exhaust openings", "Between 1/4 and 1/2 inch (no screen on dryer exhausts)."]
  ],
  qs: [
    ["An HRV fresh air intake is 4 feet from the furnace exhaust pipe at the same height. What is reported?", ["Intake too close; 10 feet horizontally or 3 feet below is required", "Cosmetic only", "Too far", "Nothing"], "Exhaust could be drawn back in."],
    ["A whole-house fan runs with all windows closed and a gas water heater in the basement. What is the danger?", ["Backdrafting of combustion gases", "Too much fresh air", "None", "Frozen pipes"], "The fan depressurizes the house."],
    ["What does an ERV transfer that an HRV does not?", ["Moisture", "Electricity", "Refrigerant", "Smoke"], "Both transfer heat."]
  ] },

{ t: "Exhaust: dryers, kitchens and baths", p: "305–312",
  goal: "Know the rules for dryer, kitchen and bathroom exhaust.",
  teach: [
    "# Clothes dryer exhaust",
    "- 4 inch, at least 28 gauge smooth metal. Joints not fastened with screws that catch lint (foil tape); male ends point with the flow.",
    "- Supported every 4 feet; within 12 feet of a gas wall penetration.",
    "- Maximum 35 feet developed length (minus 5 feet per 90 degree bend, 2 1/2 per 45), unless the dryer maker allows more. If the length is not obvious, a label should state it.",
    "- Transition duct (dryer to wall): listed metallic, no more than 8 feet, not concealed, not through walls, floors or ceilings.",
    "- Termination outside with a backdraft damper and no screen; at least 3 feet from doors, windows, intakes and crawl vents; 3 feet from a condenser.",
    "- Report: wrong size; ending in attic or crawl space; disconnected; too close to openings or condenser; lint bucket; lint clogs; screen at hood; stuck or missing damper; transition duct through walls; crushed transition.",
    "# Kitchen exhaust",
    "- Required: mechanical exhaust or an operable window. If installed, at least 100 cfm.",
    "- Over 400 cfm: makeup air, if there is a fuel-burning appliance inside the air barrier (not needed for direct vent or mechanical draft appliances).",
    "- Ducts smooth galvanized, stainless or copper; Schedule 40 PVC only under a slab. Usually 6 inch round or 3 1/4 by 10. Airtight, with a backdraft damper.",
    "- Report: plastic or flex ducts; fan blowing into the cabinet; no screen; blocked or stuck damper; small duct; missing grease filters; ending inside the building (attics and crawl spaces count as inside).",
    "# Bathroom exhaust",
    "- At least 50 cfm intermittent (20 cfm continuous), or an operable window.",
    "- Duct to the outdoors (3 inch flex is effectively out under the 2018 IRC); insulated where it passes cold space to avoid condensation; with a damper.",
    "- Report: ending in the attic or soffit, disconnected, crushed, not working, no damper.",
    "! Dryer: 4 inch smooth metal, 35 feet, no screen. Bath 50 cfm. Kitchen 100 cfm, makeup over 400."
  ],
  cards: [
    ["Clothes dryer duct", "4 inch, at least 28 gauge smooth metal; maximum 35 feet developed length (minus 5 ft per 90, 2.5 ft per 45)."],
    ["Dryer transition duct", "Listed metallic, no more than 8 feet, not concealed, not through walls, floors or ceilings."],
    ["Dryer termination", "Outdoors, backdraft damper, no screen, at least 3 feet from openings and condensers."],
    ["Bathroom exhaust rate", "At least 50 cfm intermittent (20 cfm continuous), or an operable window."],
    ["Kitchen exhaust rate", "At least 100 cfm intermittent if mechanical; makeup air for fans over 400 cfm."],
    ["Kitchen exhaust duct material", "Smooth galvanized steel, stainless or copper; Schedule 40 PVC only under a slab."],
    ["Are attics and crawl spaces outdoors for exhaust?", "No; exhaust must end outside the building."]
  ],
  qs: [
    ["A dryer vents into a plastic bucket of water indoors. What is reported?", ["Not an approved method; the dryer must exhaust outdoors", "Acceptable", "Energy saving", "Normal"], "Lint and moisture stay indoors."],
    ["A dryer duct runs 30 feet with three 90 degree bends. Is it within the usual limit?", ["No; 30 + 15 = 45 feet, over the 35 foot limit", "Yes", "Only if foil", "Length does not matter"], "Each 90 counts as 5 feet."],
    ["A bath fan duct ends at the soffit vent inside the eave. What is the concern?", ["Moist air can return into the attic", "It is correct", "Too little airflow", "Nothing"], "It must end outdoors through a proper termination."],
    ["The microwave hood fan blows into the cabinet above with no duct connected. What is reported?", ["Exhaust not ducted; air and grease go into the cabinet", "Normal recirculating", "Nothing", "Too much cfm"], "Unless it is a recirculating model with filters, it must be ducted."]
  ] },

{ t: "Attic and crawl space ventilation", p: "312–323",
  goal: "Know vent ratios, placement and closed attic and crawl space rules.",
  teach: [
    "# Attics",
    "- Default: 1 square foot of net free area per 150 square feet of attic floor. Usually reduced to 1:300 by placing 40% to 50% of the openings within 3 feet of the ridge with the rest at the eaves (or a vapor retarder in zones 6 to 8).",
    "- You estimate, not calculate. Net free area comes from the maker; screens and louvers reduce it. A big vent cover over a small hole is a common defect.",
    "- Best: continuous ridge vent plus continuous eave vents. Keep the path open from eave to ridge; baffles at least 1 inch (more is better). Vaulted ceilings need baffles the whole way.",
    "- Power attic fans can pull conditioned air (and combustion gases) from the house.",
    "- Report: eave vents blocked by insulation or paint; too little vent area; vent covers over small holes; ridge vent with no intake.",
    "# Closed (unvented) attics",
    "- Insulation at the roof deck (usually spray foam). Zones 1 to 3 with air-permeable insulation need a vapor diffusion port.",
    "- Report: openings to outside not sealed; vapor retarder missing or wrong; foam not covered by an ignition or thermal barrier.",
    "# Vented crawl spaces",
    "- 1 square foot per 150 square feet of floor, or 1 per 1,500 with a Class I vapor retarder on the soil. A vent within 3 feet of each corner for cross flow.",
    "- Ground cover at least 6 mil (10 to 12 mil reinforced is more realistic with traffic), seams lapped about 6 inches, up the walls.",
    "- Report: blocked vents, too few vents, wet soil, missing or torn ground cover, wood rot and fungal growth.",
    "# Closed (conditioned) crawl spaces",
    "- Sealed to outside, vapor retarder sealed at seams and walls, walls and rim insulated, conditioned air or exhaust at 1 cfm per 50 square feet of floor. Access door weatherstripped and insulated.",
    "- Report: openings not sealed; torn or unsealed vapor retarder; foam not protected; loose insulation; no air supply.",
    "! Attic 1:150 or 1:300. Crawl 1:150 or 1:1,500 with a ground cover. Closed crawl 1 cfm per 50 sq ft."
  ],
  cards: [
    ["Attic ventilation ratio", "1 sq ft net free area per 150 sq ft of attic, or 1 per 300 with 40 to 50% of vents near the ridge (or a vapor retarder in zones 6 to 8)."],
    ["Attic vent placement for the 1:300 ratio", "40% to 50% of the area within 3 feet of the ridge; the rest at the eaves."],
    ["Crawl space vent ratio", "1 sq ft per 150 sq ft of floor, or 1 per 1,500 with a Class I vapor retarder over the soil."],
    ["Crawl space vent location", "At least one within 3 feet of each corner."],
    ["Crawl space ground cover", "At least 6 mil poly (10 to 12 mil reinforced recommended), seams lapped about 6 inches."],
    ["Conditioned crawl space air supply", "About 1 cfm per 50 square feet of floor."],
    ["Vapor diffusion port", "Required in closed attics in zones 1 to 3 with air-permeable insulation; lets vapor out without air movement."],
    ["Power attic fan concern", "It can pull conditioned air and combustion gases out of the house through ceiling leaks."]
  ],
  qs: [
    ["A 1,500 sq ft attic has balanced ridge and eave vents. Roughly how much net free vent area is needed?", ["5 square feet", "10 square feet", "1 square foot", "15 square feet"], "1:300 = 5 sq ft."],
    ["A crawl space of 1,500 sq ft has a sealed Class I ground cover. How much vent area is needed?", ["About 1 square foot", "10 square feet", "15 square feet", "None"], "1:1,500."],
    ["A ridge vent was added but the soffits have no intake vents. What is the concern?", ["Exhaust without intake can pull air from the house", "Perfect balance", "Too much ventilation", "Nothing"], "Ventilation needs low intake and high exhaust."],
    ["Spray foam covers the crawl space walls with no covering. What may be reported?", ["Foam needs an ignition or thermal barrier", "Cosmetic only", "Too much R-value", "Nothing"], "Exposed foam is a fire concern."]
  ] }
]);
