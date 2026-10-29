# Phase 2 awards added

Checked on October 29, 2026. Each new award uses its own official page when one could be opened. This branch also includes the pass 3 tag read from `cursor/p1-award-tags` at `4677e62`.

Added: 66.

Verified on a posted 2026-27 date: 17. Not yet checked: 49.

## By pool level

Level 1 is Whitefish only. Level 2 is Flathead County. Level 3 is smaller than one state. Level 4 is one state. Level 5 is bigger than one state, or open to the country with a narrower group. Level 6 is open across the United States. No place means the official page for that award was not found, or the page that loaded did not show this award's rules. A missing page was not treated as national.

- Level 1: 0
- Level 2: 7
- Level 3: 2
- Level 4: 17
- Level 5: 11
- Level 6: 11
- No place: 18

## Why the diff shows 1,898 deleted lines

Compared with `969c5ba`, the commit this branch started from, `git diff --numstat` deletes 1,898 lines: 1,822 in `web/fixtures/r3/catalog-v1.json`, 72 in `web/fixtures/r3/p1-tagging-report.md`, 1 in `web/fixtures/r3/pin.json`, and 3 in `web/scripts/test-p1-award-tags.ts`.

The catalog lines are the same JSON records moving when the new awards were inserted ahead of the sources list. Content that was removed and not added back is 8 catalog lines: the old `catalogRevision`, and the old counts for sources 438, awards 390, cycles 390, active 109, upcoming 154, closed 97, and unknown 30. No award record was removed. No field on an existing award was removed.

Compared with `cursor/p1-award-tags` at `4677e62`: that branch has 390 awards. All 390 public ids are in this catalog, and each of those 390 award objects matches the pass 3 object field for field. All 438 pass 3 sources are still here. This catalog has 456 awards and 504 sources. The 66 new public ids are present.

## Places set from the official pages

These 11 awards had no place. The official page was read again on October 29, 2026.

No location limit is stated on the page, so the place is national and the note is `no location limit listed`:

- Women of Rollins Scholarship. https://womenofrollinsclub.org/scholarships
- Sons of Norway Foundation Scholarships. https://www.sofn.com/foundation/scholarships/
- Tall Clubs International Foundation Scholarship. https://tallclubfoundation.org/
- Beauty Changes Lives Scholarships. https://www.beautychangeslives.org/scholarships/

The page names the United States, so the place is national:

- Taco Bell Live Mas Scholarship. Legal resident of the 50 United States and D.C., or a dependent child of an active-duty military member. Window October 13, 2026 through January 5, 2027. https://tacobellfoundation.org/live-mas-scholarship/eligibilityfaq/
- Daughters of the American Revolution Scholarships. Citizens of the United States. The portal reopens November 1, 2026. https://www.dar.org/national-society/scholarships
- Partnership With Native Americans Undergraduate Scholarship. Native American students at an accredited college in the United States. Level 5 because it is also limited to Native American students. https://nativepartnership.org/education/

The page names Montana, so the place is Montana:

- Montana State Grange Scholarship. Programs for communities in Montana. https://www.grange.org/MontanaState/program/
- Grand Lodge of Montana Masonic Scholarship. The foundation lists its mailing address in Montana. https://www.mtmasonicfoundation.org/
- Reach Higher Montana Design-a-Sticker Scholarship. The design is for Montana high school students. Opens March 1 and closes March 31. The year is not posted. https://reachhighermontana.org/pay-for-school/scholarships
- PNACAC Video Scholarship. High school seniors in Alaska, Idaho, Montana, Oregon, or Washington. The tagger records Montana when Montana is named with those other states. The summary lists all five. Eleven awards of $1,500. Opens December 1, 2026. Video essay due March 15, 2027. https://www.pnacac.org/student-scholarship

The other 18 still have no place. The page did not show this award, or no official page was found. They stay on the needs-review list.

## Dates not posted yet, weekly re-check watches

17 awards. The official page is clear enough about who can apply. The 2026-27 date is not posted yet. These are not questions for Kelsey.

- Youth Serve Montana Scholarship. https://mtengage.org/allawards/scholarships-and-awards/youth-serve-mt-scholarship/
- NILE Foundation Scholarship. https://thenile.org/events/youth/scholarships/
- Flathead Pomona Grange Scholarship. https://resources.finalsite.net/images/v1771622180/sd5k12mtus/kqhhd0fst4ylbrjyvtig/PomonaGrangeScholarship2026.pdf
- Knights of Columbus U.S. Undergraduate Scholarship. https://www.kofc.org/en/what-we-do/scholarships/index.html
- Tall Clubs International Foundation Scholarship. https://tallclubfoundation.org/
- Montana Coaches Association Scholarships. https://montanacoaches.com/scholarships
- Montana 4-H Foundation Scholarships. https://www.mt4hfoundation.org/scholarships
- Montana High School Rodeo Scholarships. https://www.mhsra.org/scholarships
- Mary Naegeli Memorial Tree Farm Scholarship. https://www.treefarmsystem.org/montana-awards-and-scholarship
- Hopa Mountain Vocational Scholarship. https://www.hopamountain.org/scholars-of-promise
- UMPS CARE All-Star College Scholarship. https://www.umpscare.com/all-star-college-scholarship
- American Legion Oratorical Contest Montana. https://www.mtlegion.org/oratoricalcontest.html
- American Indian College Fund Scholarships. https://collegefund.org/students/scholarships/
- Glacier Art Museum Mark Norby Memorial Scholarship. https://glacierartmuseum.org/scholarships/
- NTGCR Scholarship. https://www.ntgcr.com/
- Reach Higher Montana Design-a-Sticker Scholarship. https://reachhighermontana.org/pay-for-school/scholarships
- Partnership With Native Americans Undergraduate Scholarship. https://nativepartnership.org/education/

PNACAC and DAR are not on this list. Both now have a posted 2026-27 date and are verified. DAR reopens November 1, 2026. The close date is not posted.

## Needs review

33 awards still need a decision. The question is eligibility, whether a Whitefish student qualifies, or whether the program is still offered.

### AHLEF Academic Scholarship

URL: https://www.ahlef.org/scholarships

Question: Which awards can a Whitefish senior claim without a college nomination?

### Central Christian Church Doris Johnston Memorial Scholarship

URL: https://fvcc.academicworks.com/opportunities/4309

Question: The page still shows a deadline of October 15, 2025. Is this scholarship still offered?

### Women of Rollins Scholarship

URL: https://womenofrollinsclub.org/scholarships

Question: Who can apply? The page lists two $1,000 awards and does not say who qualifies.

### Montana State Grange Scholarship

URL: https://www.grange.org/MontanaState/program/

Question: The page names scholarships and gives no rules. Who can apply, and is there an amount?

### Sons of Norway Foundation Scholarships

URL: https://www.sofn.com/foundation/scholarships/

Question: Membership rules differ by award. Which awards can a Whitefish student use without a family membership?

### Grand Lodge of Montana Masonic Scholarship

URL: https://www.mtmasonicfoundation.org/

Question: The site does not post rules. Who can apply, and is the scholarship still offered?

### MSU Teacher Learning Community Scholarship

URL: No official page found.

Question: No official page was found. Is this scholarship still offered, and who can apply?

### Montana School Nutrition Association Scholarship

URL: No official page found.

Question: No official page was found. Is this scholarship still offered, and who can apply?

### David Astle Scholarship

URL: No official page found.

Question: No official page was found. Is the David Astle Scholarship still offered?

### Harold Tutvedt Memorial Scholarship

URL: No official page found.

Question: No current page was found. Is the Harold Tutvedt Memorial Scholarship still offered?

### Montana Food Distributors Association Scholarship

URL: http://www.mfda.biz/index.aspx/dues/Scholarship

Question: The listed page returned an error. Is there a working official page, and who can apply?

### Kalispell Youth Softball Association Scholarship

URL: No official page found.

Question: No official page was found. Is the scholarship still offered, and can a Whitefish student apply?

### MFPE Scholarship

URL: https://www.mfpe.org/

Question: The site has no student scholarship. Does MFPE still offer one?

### Flathead Education Foundation Scholarship

URL: No official page found.

Question: The newest public form is from 2025. Is there a 2026-27 scholarship?

### John V. Cooley Scholarship

URL: No official page found.

Question: No sponsor page was found. Is it still offered, and is it limited to University of Montana forestry or Montana State University agriculture?

### Flathead County Farmers Union Scholarship

URL: No official page found.

Question: No official page was found. Is this scholarship still offered?

### Montana PTA Scholarship

URL: https://www.montanapta.org/

Question: The site has no scholarship. Does Montana PTA still offer a teaching scholarship?

### Five Valley Chorus Sweet Adelines Music Scholarship

URL: No official page found.

Question: No official page was found. Is the Five Valley Chorus scholarship still offered?

### Universal Athletic Services Scholarship

URL: No official page found.

Question: No official page was found. Is it still offered, and who can apply?

### Moose Scholarship

URL: No official page found.

Question: Which Moose scholarship can a Whitefish student use, and is membership required?

### Foster Care Education and Training Voucher

URL: https://www.reachhighermontana.org/

Question: The official 2026-27 voucher page was not found. Where is it, and who can apply?

### Region I MASSP Principal's Scholarship

URL: No official page found.

Question: No official page was found. Is the Region I scholarship still offered, and who can apply?

### Reach Higher Montana Stick with Scholarships

URL: https://reachhighermontana.org/

Question: The contest was not on the Reach Higher Montana site. Is Stick with Scholarships still offered?

### Mountain America Foundation Elevate Scholarship

URL: https://www.macu.com/about/community/mountain-america-foundation/scholarship-notification-form

Question: The form page was empty. Is the Elevate Scholarship still offered, and who can apply?

### Beauty Changes Lives Scholarships

URL: https://www.beautychangeslives.org/scholarships/

Question: The page is a directory. Which program should a Whitefish student use?

### Montana Youth Soccer Ralph Serette Scholarship

URL: https://www.montanayouthsoccer.com/

Question: The rules were not on the page. Who can apply?

### Montana TRIO Achievement Grant

URL: No official page found.

Question: No official page was found. Is the Montana TRIO Achievement Grant still offered?

### George and Faye Harris Scholarship

URL: No official page found.

Question: No official page was found. Is the George and Faye Harris Scholarship still offered?

### Sandpiper Art Gallery Art Scholarship

URL: https://sandpiperartgallery.com/

Question: The gallery site does not show a scholarship. Does it still offer one?

### Boom and Bucket Heavy Machinery Scholarship

URL: https://www.boomandbucket.com/

Question: The site does not show a scholarship. Is it still offered?

### Unity Bank Scholarship

URL: https://www.unitybank.com/

Question: The site that loaded is not a local scholarship page. Which Unity Bank offers this award?

### Essential Visionaries Scholarship Fund

URL: https://learnmore.scholarsapply.org/essentialvisionaries/

Question: The page says the rules moved and does not show them. Is the fund still offered?

### Valley Banks Community Scholarship

URL: No official page found.

Question: No official page was found. Which Valley Bank runs this scholarship?

## Skipped

- MSU Hilleman Scholarship: Already in the catalog as Hilleman Scholars Program.
- FVCC Eagle Scholarship: Already in the catalog as Flathead Valley Community College Eagle Scholarship.
- FVCC Institutional Scholarships: This is a college aid portal, not one award. School aid stays out of this add.
- FVCC Scholarships, 209 opportunities: Same FVCC aid portal, not one award.
- Montana Sheriffs and Peace Officers Association Scholarship: Already in the catalog as two Montana Sheriffs and Peace Officers awards.
- Kid's Chance of Montana: Already in the catalog.
- Don K Whitefish: Same award as Don K Chevrolet-Subaru-Chrysler-Dodge-Jeep-Ram Scholarship.
- Whitefish Soroptimist Certificate/Trades Scholarship: Already in the catalog as Soroptimist Certificate Scholarships.
- Soroptimist Scholarship for High School Seniors: Already in the catalog as Whitefish Soroptimist Memorial Scholarship for Girls Graduating High School.
- Reach Higher Montana general application and It's Scholarship Time: Already in the catalog as Reach Higher Montana Scholarship.
- Montana Community Foundation: Not one award. Individual Montana Community Foundation scholarships are already in the catalog.
- MUS American Indian Undergraduate Tuition Waiver: This is a Montana University System tuition waiver, not a separate scholarship contest.
- Duplicate nearby-school rows: Second copies of NILE, American Indian College Fund, Stick with Scholarships, Montana Community Foundation, and Northwest Montana United Way were combined into one award each.
- Ace Hardware Scholarship: Watch list only. Not offered for 2026.
- Father Michael J. O'Neill Scholarship: Watch list only. Not offered for 2026.
