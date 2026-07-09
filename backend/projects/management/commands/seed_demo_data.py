import datetime

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from engagements.models import Attachment, Engagement, Message
from payments.models import LedgerEntry, Transaction
from payments.services import calculate_fee
from projects.models import Project, ProjectMilestone, Review
from users.models import SMEProfile, StudentProfile, User

# Copy below is lifted verbatim from the SkillBridge prototype (SkillBridge Screens.html,
# decompiled from its bundled TASKS/STUDENTS arrays) so the dev environment looks like the
# real design from day one instead of an empty marketplace.

TASKS = [
    dict(sme="Kopi Kita", industry="F&B", loc="Kuala Lumpur", title="Ramadan promo — 12 Instagram posts",
         cat=Project.Category.GRAPHIC_DESIGN, price=350, days=7,
         about="Specialty coffee chain with four outlets around KL and Selangor, known for locally roasted beans.",
         desc="We are running a Ramadan and Raya promo across Instagram and need 12 feed posts — covers plus carousels — that feel warm and festive without the template look. You will work from our product shots and brand fonts; captions come from our team.",
         desc2="One revision round per batch. Brand files are handed over on day one and drafts are reviewed within 24 hours.",
         bullets=["Portfolio with F&B or lifestyle brand work", "Comfortable designing in BM and English", "Delivers source files (AI or Figma)"],
         skills=["Illustrator", "Social design", "Branding", "Layout"],
         timeline=[("Kick-off & moodboard", "Brand files and product shots handed over"),
                   ("Draft covers", "Three directions, one revision round"),
                   ("Final 12 posts", "Source files and export pack delivered")],
         rating=4.8, rating_count=12),
    dict(sme="Nadia's Kitchen", industry="F&B", loc="Shah Alam", title="One-page website for home bakery",
         cat=Project.Category.WEB_DEV, price=1200, days=14,
         about="Home-grown bakery famous for burnt cheesecake, moving from Instagram DMs to real online orders.",
         desc="We need a fast one-page site: menu, gallery, order form with WhatsApp handoff, and pickup info. Mobile-first — 90% of our customers order from their phone.",
         desc2="Copy and photos are ready. We would like a small walkthrough call at handover so we can edit the menu ourselves.",
         bullets=["Has shipped at least one live site", "Can set up a simple order or booking form", "Explains things in plain language, BM or EN"],
         skills=["HTML/CSS", "Responsive design", "Forms", "Basic SEO"],
         timeline=[("Structure & wireframe", "One layout direction, quick approval"),
                   ("Build & content in", "Live on a staging link for review"),
                   ("Launch & handover", "Domain connected, walkthrough call")],
         rating=5.0, rating_count=3),
    dict(sme="Batik Craft Co.", industry="Retail / Crafts", loc="George Town", title="10 product descriptions (EN + BM)",
         cat=Project.Category.CONTENT_WRITING, price=280, days=5,
         about="Penang atelier selling hand-drawn batik scarves and homeware to local and overseas buyers.",
         desc="Write 10 product descriptions in both English and Bahasa Melayu — around 80 words each — that tell the story of the motif and the maker, not just the fabric specs.",
         desc2="We provide photos, artisan notes and current drafts. Tone: warm, crafted, never salesy.",
         bullets=["Fluent written BM and English", "Sample of past product or brand copy", "Comfortable with light SEO keywords"],
         skills=["Copywriting", "Translation", "SEO basics", "E-commerce"],
         timeline=[("Tone alignment", "Two sample descriptions for sign-off"),
                   ("First five", "One revision round"),
                   ("Final delivery", "All 10 in both languages")],
         rating=4.9, rating_count=8),
    dict(sme="Urban Fit Studio", industry="Fitness", loc="Petaling Jaya", title="TikTok content — 2 week takeover",
         cat=Project.Category.SOCIAL_MEDIA, price=600, days=14,
         about="Boutique gym in PJ running group classes — strong community, quiet social media.",
         desc="Take over our TikTok for two weeks: plan, shoot and post 10–12 short videos around classes, trainers and member stories. You film on-site during evening classes.",
         desc2="A trainer is assigned as your point person. We care about consistency and hooks, not fancy gear.",
         bullets=["Active TikTok or Reels portfolio", "Can film on-site in PJ, 2–3 evenings a week", "Plans content in a simple calendar"],
         skills=["TikTok", "Short video", "CapCut", "Content calendar"],
         timeline=[("Content plan", "12-video calendar approved"),
                   ("Week 1 posts", "Five videos live, mid-point review"),
                   ("Week 2 + recap", "Remaining videos plus results recap")],
         rating=4.7, rating_count=6),
    dict(sme="Green Grocer MY", industry="E-commerce / Grocery", loc="Subang Jaya", title="Sales dashboard from POS exports",
         cat=Project.Category.DATA, price=450, days=10,
         about="Online grocer delivering fresh produce across Klang Valley from two micro-warehouses.",
         desc="Clean six months of messy POS exports and build a simple dashboard: weekly sales, top categories, repeat-customer rate. Excel or Power BI — your call, as long as we can refresh it monthly.",
         desc2="Data is anonymised before handover. A 30-minute walkthrough at the end is part of the scope.",
         bullets=["Strong Excel or Power BI skills", "Has cleaned real-world messy data before", "Can document the refresh steps simply"],
         skills=["Excel", "Power BI", "Data cleaning", "Dashboards"],
         timeline=[("Data audit", "Cleaning plan and column mapping"),
                   ("Draft dashboard", "Core views ready for feedback"),
                   ("Final + walkthrough", "Refresh guide and handover call")],
         rating=4.8, rating_count=9),
    dict(sme="Selangor Dental Care", industry="Healthcare", loc="Klang", title="Logo refresh + one-page brand sheet",
         cat=Project.Category.GRAPHIC_DESIGN, price=500, days=10,
         about="Family dental clinic in Klang, 12 years running, refreshing its look before a second branch opens.",
         desc="Modernise our existing logo — keep it recognisable to long-time patients — and produce a one-page brand sheet: colours, type, dos and don'ts, plus signage-ready files.",
         desc2="Two concept directions, two revision rounds on the chosen one. Print-ready output required.",
         bullets=["Logo or identity work in portfolio", "Delivers vector + print-ready files", "Can present two directions with rationale"],
         skills=["Illustrator", "Brand identity", "Print prep", "Typography"],
         timeline=[("Two directions", "Presented with short rationale"),
                   ("Refinement", "Two revision rounds on chosen mark"),
                   ("Final pack", "Vectors, brand sheet, signage files")],
         rating=4.6, rating_count=5),
    dict(sme="TechNest Solutions", industry="IT Services", loc="Cyberjaya", title="4 SEO articles for IT services blog",
         cat=Project.Category.CONTENT_WRITING, price=640, days=12,
         about="Managed IT provider for SMEs — helpdesk, cloud migration and cybersecurity audits.",
         desc="Four 1,200-word articles targeting keywords we supply (e.g. “cloud migration for SMEs Malaysia”). Practical, example-driven, no fluff — our readers are business owners, not engineers.",
         desc2="We provide keyword briefs and an in-house reviewer. One revision round per article.",
         bullets=["Clear, plain-English tech writing", "Understands basic on-page SEO", "Reliable with weekly deadlines"],
         skills=["SEO writing", "B2B content", "Research", "CMS basics"],
         timeline=[("Outlines", "All four outlines approved"),
                   ("Articles 1–2", "First pair with revision round"),
                   ("Articles 3–4", "Final pair, uploaded to CMS")],
         rating=4.9, rating_count=14),
    dict(sme="Lestari Farms", industry="Agriculture / F&B", loc="Seremban", title="Shopee store setup — 20 listings",
         cat=Project.Category.WEB_DEV, price=520, days=9,
         about="Family farm selling honey, kicap and sambal, moving from pasar malam stalls to online.",
         desc="Set up our Shopee store end to end: shop profile, 20 product listings with clean titles and variants, shipping settings and a simple banner. Product photos provided.",
         desc2="We want to learn as you go — a short Loom-style walkthrough of how to add products ourselves is part of the deal.",
         bullets=["Has run or set up a Shopee/Lazada store", "Writes clear listing titles in BM and EN", "Basic image cropping and banner skills"],
         skills=["Shopee", "E-commerce ops", "Listing copy", "Canva"],
         timeline=[("Store shell", "Profile, policies, shipping configured"),
                   ("First 10 listings", "Review of titles and variants"),
                   ("All 20 + walkthrough", "Banner live, tutorial recorded")],
         rating=5.0, rating_count=2),
    dict(sme="Kayu & Co.", industry="Furniture", loc="Kota Damansara", title="Product photo retouching — 30 shots",
         cat=Project.Category.GRAPHIC_DESIGN, price=420, days=6,
         about="Small-batch furniture studio crafting solid-wood pieces for apartments.",
         desc="Retouch 30 product photos: background cleanup to pure white, colour-true wood tones, light dust removal. Consistency across the whole set matters more than heavy editing.",
         desc2="RAW files supplied via Office upload. First five shots approved before the full batch.",
         bullets=["Confident in Photoshop or Lightroom", "Colour-accurate editing on wood tones", "Batch workflow — consistent output"],
         skills=["Photoshop", "Lightroom", "Retouching", "Colour grading"],
         timeline=[("Test batch (5)", "Style locked before full run"),
                   ("Batch 1 (15)", "Consistency check"),
                   ("Final 30", "Web + print exports")],
         rating=4.7, rating_count=7),
]

STUDENTS = [
    dict(name="Aisyah Rahman", uni="Universiti Malaya", major="BA Graphic Design", year=3, cat="Design",
         skills=["Illustrator", "Photoshop", "Figma", "Brand identity", "Social media design", "Layout & print", "Motion basics"],
         rating=4.9, rating_count=23, lo=300, hi=600, avail="now", langs="BM · EN",
         bio="Third-year design student at UM. I have run 20+ social and branding micro-projects for Malaysian F&B and retail brands — fast turnarounds, tidy source files, and I never miss a deadline during exam season (I plan around it).",
         reviews=[("Farah Amin", "Kopi Kita", 5.0, "Turned our Raya campaign around in four days — the covers looked better than agency work we paid triple for."),
                  ("Marcus Yeo", "Kayu & Co.", 4.8, "Fast, organised, and took feedback without fuss. The brand sheet she made still guides everything we post.")]),
    dict(name="Daniel Lim", uni="Sunway University", major="BSc Computer Science", year=2, cat="Web",
         skills=["React", "WordPress", "HTML/CSS", "JavaScript", "Landing pages", "Web forms", "Analytics setup"],
         rating=4.8, rating_count=17, lo=800, hi=1500, avail="now", langs="EN · BM · 中文",
         bio="CS undergrad who ships fast, clean one-pagers and small business sites. I hand over everything documented so owners can edit their own content — no lock-in, no retainer upsell.",
         reviews=[("Nadia Hassan", "Nadia's Kitchen", 5.0, "Our order page went live in a week and sales moved online almost overnight. He even trained me to edit the menu."),
                  ("Kevin Foo", "TechNest Solutions", 4.7, "Clean build, sensible structure, documented handover. Exactly what a small team needs.")]),
    dict(name="Nurul Izzati", uni="Universiti Kebangsaan Malaysia", major="BA English Studies", year=3, cat="Writing",
         skills=["Copywriting", "Translation BM↔EN", "SEO writing", "Product descriptions", "Blog articles", "Proofreading"],
         rating=5.0, rating_count=31, lo=200, hi=450, avail="now", langs="BM · EN",
         bio="Bilingual writer who makes small brands sound like themselves in both BM and English. 31 completed tasks across e-commerce copy, blogs and translations — with a perfect on-time record.",
         reviews=[("Lim Bee Kim", "Batik Craft Co.", 5.0, "Descriptions in both languages that actually sound like us. Customers quote her lines back to us at fairs."),
                  ("Devi Shan", "Green Grocer MY", 5.0, "Our weekly blog went from an afterthought to the top source of site traffic.")]),
    dict(name="Jason Tan", uni="Taylor's University", major="BA Mass Communication", year=2, cat="Social Media",
         skills=["TikTok", "Instagram Reels", "CapCut", "Content strategy", "Community management", "Basic analytics"],
         rating=4.7, rating_count=12, lo=400, hi=700, avail="from", avail_from="2026-07-15", langs="EN · BM · 中文",
         bio="I grow small-brand TikToks with hooks, consistency and zero cringe. Comfortable filming on-site around KL and PJ — gyms, cafés and campus events are my usual beat.",
         reviews=[("Alia Rashid", "Urban Fit Studio", 4.7, "Our TikTok went from 300 to 4,000 followers during his two-week takeover — and stayed active after."),
                  ("Syed Amir", "Kopi Kita", 4.6, "Sharp Reels calendar, never missed a posting slot. Good instincts for what our regulars share.")]),
    dict(name="Priya Nair", uni="Universiti Sains Malaysia", major="BSc Statistics", year=3, cat="Data",
         skills=["Excel (advanced)", "Power BI", "Python (pandas)", "Data cleaning", "Dashboards", "Survey analysis"],
         rating=4.9, rating_count=19, lo=350, hi=650, avail="now", langs="EN · BM · தமிழ்",
         bio="Statistics student who turns messy exports into dashboards owners actually open every Monday. I document every refresh step so the numbers keep working after I hand over.",
         reviews=[("Devi Shan", "Green Grocer MY", 5.0, "The dashboard pays for itself every reorder cycle. She cleaned two years of chaos without complaint."),
                  ("Hafiz Omar", "Lestari Farms", 4.9, "Explained the numbers in plain language and left us a guide we still use monthly.")]),
    dict(name="Haziq Roslan", uni="UiTM Shah Alam", major="BA Film & Video", year=3, cat="Video",
         skills=["Premiere Pro", "After Effects basics", "CapCut", "Colour grading", "Motion graphics", "Event videography"],
         rating=4.8, rating_count=14, lo=450, hi=800, avail="now", langs="BM · EN",
         bio="Video student cutting promos, menu launches and event recaps for SMEs around Klang Valley. Cinematic look on a phone-shot budget — that is the specialty.",
         reviews=[("Alia Rashid", "Urban Fit Studio", 4.8, "Class promo videos cut within a day of filming. Members share them without being asked."),
                  ("Farah Amin", "Kopi Kita", 4.7, "Our menu launch teaser looked cinematic — shot entirely on a phone gimbal.")]),
    dict(name="Mei Ling Chong", uni="UTAR Sungai Long", major="BSc Software Engineering", year=4, cat="Design",
         skills=["Figma", "UI design", "Prototyping", "Design systems", "User flows", "Handoff specs"],
         rating=4.9, rating_count=21, lo=500, hi=900, avail="from", avail_from="2026-07-10", langs="EN · 中文 · BM",
         bio="Final-year software engineering student who designs interfaces developers can actually build. App screens, admin panels and design-system tidy-ups are my bread and butter.",
         reviews=[("Kevin Foo", "TechNest Solutions", 5.0, "Gave us a Figma prototype our devs built from directly — zero guesswork in handoff."),
                  ("Nadia Hassan", "Nadia's Kitchen", 4.9, "Redesigned our order flow so cleanly that repeat orders went up the same month.")]),
    dict(name="Arif Danial", uni="IIUM Gombak", major="BA Communication", year=2, cat="Writing",
         skills=["Ad copywriting", "Email campaigns", "Video scripts", "Landing page copy", "BM↔EN adaptation"],
         rating=4.6, rating_count=9, lo=250, hi=500, avail="now", langs="BM · EN · العربية",
         bio="Copywriter focused on ads and email — short words that move numbers. I A/B test headlines by default and report what actually won.",
         reviews=[("Syed Amir", "Kopi Kita", 4.6, "His ad copy doubled our click-through in the first week of Raya promos."),
                  ("Lim Bee Kim", "Batik Craft Co.", 4.5, "Email series felt personal, not blasted. Open rates we had never seen before.")]),
    dict(name="Kavitha Raj", uni="Multimedia University", major="BIT E-Commerce", year=3, cat="Web",
         skills=["Shopify", "Shopee & Lazada ops", "HTML/CSS", "Product listings", "Store analytics", "Payment setup"],
         rating=4.8, rating_count=15, lo=600, hi=1100, avail="now", langs="EN · BM · தமிழ்",
         bio="E-commerce student who has launched 11 marketplace stores for family businesses — from empty account to first sale, including listings, shipping setup and a tutorial for the owner.",
         reviews=[("Hafiz Omar", "Lestari Farms", 4.9, "Shopee store live with 20 listings in a weekend — first order came in three days later."),
                  ("Devi Shan", "Green Grocer MY", 4.8, "Sorted our Lazada variants and shipping rules that had confused us for months.")]),
]

DEMO_PASSWORD = "skillbridge-demo"

# Office threads from the prototype — (sender_role, text, attachment or None).
THREADS = [
    dict(sme="Kopi Kita", student="Aisyah Rahman", task="Ramadan promo — 12 Instagram posts",
         status=Engagement.Status.IN_PROGRESS, funded=True,
         messages=[
             ("sme", "Salam Aisyah! Loved your moodboard. For Raya we want warm gold and emerald — not the usual purple.", None),
             ("student", "On it! I will send three cover directions tonight. Any product shots I should feature?", None),
             ("sme", "Latest shots from our KLCC outlet attached.", ("raya-product-shots.zip", 210 * 1024 * 1024)),
             ("student", "Draft 2 attached — swapped the kuih flatlay onto covers 4–6.", ("raya-drafts-v2.zip", 148 * 1024 * 1024)),
             ("sme", "These are great. Final captions by Thursday and we are set.", None),
         ]),
    dict(sme="Green Grocer MY", student="Priya Nair", task="Sales dashboard from POS exports",
         status=Engagement.Status.DELIVERED, funded=True,
         messages=[
             ("student", "Dashboard delivered! Refresh guide is on the last tab. Escrow release is on your side — happy to do a walkthrough call.", ("sales-dashboard-jun.pbix", 24 * 1024 * 1024)),
             ("sme", "Reviewing today. The category split view is exactly what we needed.", None),
         ]),
    dict(sme="Batik Craft Co.", student="Nurul Izzati", task="10 product descriptions (EN + BM)",
         status=Engagement.Status.AGREED, funded=True,
         messages=[
             ("sme", "Agreed on RM 280 for 10 descriptions, EN + BM. Escrow is funded — brief attached.", ("product-brief.pdf", 6 * 1024 * 1024)),
             ("student", "Terima kasih! First five will be with you by Friday.", None),
         ]),
    dict(sme="Urban Fit Studio", student="Jason Tan", task="TikTok content — 2 week takeover",
         status=Engagement.Status.REACHED_OUT, funded=False,
         messages=[
             ("sme", "Hi Jason — saw your Reels work for campus events. Could you take over our TikTok for two weeks in July? Budget on the task post.", None),
         ]),
    dict(sme="Nadia's Kitchen", student="Daniel Lim", task="One-page website for home bakery",
         status=Engagement.Status.REACHED_OUT, funded=False,
         messages=[
             ("student", "Hi Nadia! I build fast one-pagers with online ordering built in — portfolio is on my profile. Keen to hear more about the bakery site.", None),
         ]),
]

# Prototype wallet chart series (oldest first, current month last).
STUDENT_EARNINGS_SERIES = [420, 660, 580, 890, 1020, 1240]   # Aisyah Rahman
BUSINESS_SPEND_SERIES = [980, 1240, 1160, 1730, 1980, 2180]  # Kopi Kita


class Command(BaseCommand):
    help = "Seed the dev database with the SkillBridge prototype's demo tasks and students."

    def handle(self, *args, **options):
        with transaction.atomic():
            sme_by_name = {}
            for t in TASKS:
                if t["sme"] not in sme_by_name:
                    sme_by_name[t["sme"]] = self._make_sme(
                        t["sme"], t["industry"], t["loc"], t["rating"], t["rating_count"]
                    )

            for t in TASKS:
                self._make_task(t, sme_by_name[t["sme"]])

            student_by_name = {}
            for s in STUDENTS:
                student_by_name[s["name"]] = self._make_student(s)

            for s in STUDENTS:
                student = student_by_name[s["name"]]
                for reviewer_name, company, rating, quote in s["reviews"]:
                    sme = sme_by_name.get(company)
                    if not sme:
                        continue
                    Review.objects.get_or_create(
                        project=None,
                        reviewer=sme.user,
                        reviewee=student.user,
                        defaults=dict(rating=round(rating), comment=quote),
                    )

            self._seed_office_threads(sme_by_name, student_by_name)
            self._seed_ledger_history(sme_by_name, student_by_name)

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(TASKS)} tasks, {len(STUDENTS)} students and "
            f"{len(THREADS)} Office threads. "
            f"All demo accounts use password '{DEMO_PASSWORD}'."
        ))

    def _seed_office_threads(self, sme_by_name, student_by_name):
        for t in THREADS:
            sme = sme_by_name[t["sme"]]
            student = student_by_name[t["student"]]
            project = Project.objects.filter(sme=sme, title=t["task"]).first()

            engagement, _ = Engagement.objects.get_or_create(
                sme=sme, student=student, defaults=dict(project=project),
            )
            engagement.project = project
            engagement.status = t["status"]
            engagement.agreed_price = project.budget if (t["funded"] and project) else None
            engagement.save()

            engagement.messages.all().delete()
            for role, text, attachment in t["messages"]:
                sender = sme.user if role == "sme" else student.user
                message = Message.objects.create(engagement=engagement, sender=sender, text=text)
                if attachment:
                    name, size = attachment
                    # Metadata-only demo row — no real file behind it.
                    Attachment.objects.create(
                        message=message,
                        file=f"engagement_files/seed/{name}",
                        original_name=name,
                        size_bytes=size,
                    )

            Transaction.objects.filter(engagement=engagement).delete()
            if t["funded"] and engagement.agreed_price is not None:
                Transaction.objects.create(
                    engagement=engagement,
                    amount=engagement.agreed_price,
                    platform_fee=calculate_fee(engagement.agreed_price),
                    status=Transaction.Status.HELD,
                    payment_reference="TEST-MODE-SEED",
                )

    def _seed_ledger_history(self, sme_by_name, student_by_name):
        """Backdated ledger rows so the Wallet chart shows the prototype's
        month-over-month shape. auto_now_add wins on create, so backdate via a
        queryset update afterwards."""
        aisyah = student_by_name["Aisyah Rahman"].user
        kopi = sme_by_name["Kopi Kita"].user
        LedgerEntry.objects.filter(user__in=[aisyah, kopi]).delete()

        now = timezone.now()
        n = len(STUDENT_EARNINGS_SERIES)
        for i, (earned, spent) in enumerate(zip(STUDENT_EARNINGS_SERIES, BUSINESS_SPEND_SERIES)):
            months_back = n - 1 - i
            year, month = now.year, now.month
            for _ in range(months_back):
                month -= 1
                if month == 0:
                    year, month = year - 1, 12
            when = timezone.make_aware(datetime.datetime(year, month, 1, 12, 0))
            created = [
                LedgerEntry.objects.create(
                    user=aisyah, kind=LedgerEntry.Kind.EARNING, amount=Decimal(earned)
                ).pk,
                LedgerEntry.objects.create(
                    user=kopi, kind=LedgerEntry.Kind.SPEND, amount=Decimal(spent)
                ).pk,
                LedgerEntry.objects.create(
                    user=kopi, kind=LedgerEntry.Kind.FEE, amount=calculate_fee(Decimal(spent))
                ).pk,
            ]
            LedgerEntry.objects.filter(pk__in=created).update(created_at=when)

    def _make_sme(self, name, industry, location, rating, rating_count):
        username = slugify(name)[:150]
        user, _ = User.objects.update_or_create(
            username=username,
            defaults=dict(email=f"{username}@skillbridge.test", role="sme", is_verified=True),
        )
        user.set_password(DEMO_PASSWORD)
        user.save()
        sme, _ = SMEProfile.objects.update_or_create(
            user=user,
            defaults=dict(
                company_name=name,
                industry=industry,
                location=location,
                ssm_number=f"SSM-{abs(hash(name)) % 900000 + 100000}",
                is_verified=True,
                rating=rating,
                rating_count=rating_count,
            ),
        )
        return sme

    def _make_task(self, t, sme):
        project, _ = Project.objects.update_or_create(
            sme=sme,
            title=t["title"],
            defaults=dict(
                description=t["desc"],
                description_extra=t["desc2"],
                category=t["cat"],
                budget=t["price"],
                deadline=datetime.date.today() + datetime.timedelta(days=t["days"]),
                status=Project.Status.OPEN,
                required_skills=t["skills"],
                looking_for_bullets=t["bullets"],
            ),
        )
        project.milestones.all().delete()
        for order, (label, note) in enumerate(t["timeline"]):
            ProjectMilestone.objects.create(
                project=project, label=label, note=note,
                due_date=datetime.date.today() + datetime.timedelta(days=(order + 1) * max(t["days"] // 3, 1)),
                order=order,
            )
        return project

    def _make_student(self, s):
        username = slugify(s["name"])[:150]
        user, _ = User.objects.update_or_create(
            username=username,
            defaults=dict(email=f"{username}@skillbridge.test", role="student", is_verified=True),
        )
        user.set_password(DEMO_PASSWORD)
        user.save()
        grad_year = 2026 + (4 - s["year"])
        student, _ = StudentProfile.objects.update_or_create(
            user=user,
            defaults=dict(
                university=s["uni"],
                major=s["major"],
                graduation_year=grad_year,
                primary_category=s["cat"],
                skills=s["skills"],
                bio=s["bio"],
                languages=s["langs"],
                price_low=s["lo"],
                price_high=s["hi"],
                availability_status=s["avail"],
                available_from=s.get("avail_from"),
                rating=s["rating"],
                rating_count=s["rating_count"],
                is_vetted=True,
                vetted_at=timezone.now(),
            ),
        )
        return student
