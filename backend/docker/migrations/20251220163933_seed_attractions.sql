-- +goose Up
-- +goose StatementBegin
INSERT INTO attractions (name_en, name_ru, name_kz, description, category_id, city, popularity) VALUES
-- Almaty attractions
('Kok Tobe', 'Кок-Тобе', 'Көк Төбе', 'A hill-top park with panoramic views of Almaty, a recreational area, Ferris wheel and cafes; reachable by cable car.', 1, 'Almaty', 0.91),
('Medeu Ice Skating Rink', 'Медеу', 'Медеу', 'High-altitude outdoor ice rink in the mountains above Almaty, famous for speed skating and mountain scenery.', 2, 'Almaty', 0.95),
('Shymbulak Ski Resort', 'Шымбулак', 'Шымбұлақ', 'Popular mountain resort above Almaty accessed by gondola — skiing in winter, hiking and lifts in summer.', 1, 'Almaty', 0.93),
('Big Almaty Lake', 'Большое Алматинское озеро', 'Үлкен Алматы көлі', 'A scenic high-altitude lake in the Ile-Alatau mountains, a popular day-trip and photo spot.', 1, 'Almaty', 0.88),
('Panfilov Park', 'Парк Панфилова', 'Панфилов паркі', 'Historic park in central Almaty featuring monuments and the colorful Ascension (Zenkov) Cathedral.', 3, 'Almaty', 0.86),
('Ascension (Zenkov) Cathedral', 'Вознесенский собор (Собор Зенкова)', 'Көтерілу шіркеуі (Зенков кафедралды шіркеуі)', 'A striking wooden Orthodox cathedral located inside Panfilov Park—one of Almaty''s architectural landmarks.', 3, 'Almaty', 0.87),
('Green Bazaar (Zelenyy Bazaar)', 'Зеленый базар', 'Жасыл базар', 'Traditional covered market offering produce, meats, dairy, spices and Kazakh specialties—very lively and local.', 4, 'Almaty', 0.84),
('Central State Museum of Kazakhstan (Almaty branch)', 'Центральный государственный музей Казахстана (филиал)', 'Қазақстан ұлттық музейі (Алматы филиалы)', 'Museum exhibiting Kazakhstan''s archaeology, ethnography and modern history collections.', 5, 'Almaty', 0.78),
('Kasteev State Museum of Arts', 'Государственный музей искусств имени А. Кастеева', 'А. Қастеев атындағы мемлекеттік өнер мұражайы', 'Kazakhstan''s largest art museum, named after painter Abilkhan Kasteev, with national and Soviet-era works.', 5, 'Almaty', 0.72),
('Arasan Baths', 'Арасын бани', 'Арасан моншалары', 'Large public baths and spa complex in Almaty offering traditional steam and bathing experiences.', 6, 'Almaty', 0.61),
('Botanical Garden of Almaty', 'Ботанический сад Алматы', 'Алматы ботаникалық бағы', 'Green space with diverse regional and exotic plant collections; good for walks and nature lovers.', 1, 'Almaty', 0.57),
('Almaty Central Mosque', 'Центральная соборная мечеть Алматы', 'Алматы орталық мешіті', 'One of the major mosques in Almaty, serving as an important religious and architectural landmark.', 7, 'Almaty', 0.63),
('Panfilov Heroes Memorial', 'Мемориал Панфиловцам', 'Панфиловшылар ескерткіші', 'War memorial honoring the Panfilov division that fought in WWII, located in Panfilov Park.', 3, 'Almaty', 0.65),
('Almaty Opera and Ballet Theatre (Abay Opera)', 'Абай театр оперы и балета', 'Абай атындағы опера және балет театры', 'Major cultural venue offering opera and ballet performances.', 8, 'Almaty', 0.82),
('Museum of Folk Musical Instruments', 'Музей народных музыкальных инструментов', 'Ұлттық музыкалық аспаптар музейі', 'Displays traditional Kazakh musical instruments and explains their cultural role.', 5, 'Almaty', 0.48),
('Almaty Zoo', 'Алматинский зоопарк', 'Алматы хайуанаттар бағы', 'City zoo with regional and exotic species, family-friendly attraction.', 9, 'Almaty', 0.54),
('Museum of Kazakh Theatre (Daryn?)', 'Музей казахского театра', 'Қазақ театры музейі', 'Small museum dedicated to the history of Kazakh theatre and performing arts (local cultural museum).', 5, 'Almaty', 0.33),
('First President''s Park', 'Парк Первого Президента', 'Тұңғыш Президент саябағы', 'Large park and green area in Almaty with pathways and memorials.', 10, 'Almaty', 0.46),
('Republic Square (Almaty city landmark)', 'Площадь Республики (Алматы)', 'Республика алаңы (Алматы)', 'Public square and civic space used for events and gatherings in Almaty.', 11, 'Almaty', 0.39),
('Rakhat Chocolate Factory Outlet and Tasting (Green Bazaar area)', 'Рахат (шоколад) / дегустации', 'Рахат шоколад зауыты (дегустация)', 'Famous Kazakh chocolate brand; visitors often sample local sweets here or in bazaar stalls.', 12, 'Almaty', 0.59),
('Ile-Alatau National Park (access from Almaty)', 'Иле-Алатауский национальный парк', 'Іле-Алатау ұлттық паркі', 'Large national park bordering Almaty, including trails, lakes and alpine scenery.', 1, 'Almaty', 0.83),
('Panfilov House-Museum(s) and local heritage sites', 'Музей-памятники Панфилова', 'Панфилов үй-мұражайлары', 'Several small heritage and house-museums in central Almaty commemorating local history and personalities.', 5, 'Almaty', 0.28),
('Almaty Central State Philharmonic', 'Филармония Алматы', 'Алматы филармониясы', 'Concert venue for classical and traditional music performances.', 8, 'Almaty', 0.52),
('Almaty Museum (city museum)', 'Алматинский городской музей', 'Алматы қаласының мұражайы', 'Museum presenting the history and development of Almaty and surrounding region.', 5, 'Almaty', 0.36),
('Zenkov Park galleries & small exhibition spaces (Almaty)', 'Галереи парка Зенкова', 'Зенков саябағы галереялары', 'Smaller galleries and cultural kiosks located around central Panfilov Park and cathedral area.', 19, 'Almaty', 0.22),
('Chimbulak/Alpine trails (Almaty outskirts)', 'Горные тропы у Чимбулака', 'Шымбұлақ айналасындағы жаяу жүріс жолдары', 'Trail networks and natural hiking routes above Almaty near Shymbulak resort.', 1, 'Almaty', 0.54),
('Charyn Canyon (day-trip from Almaty region)', 'Каньон Шарын', 'Шарын шатқалы', 'Dramatic canyon often visited on day-trips from Almaty — known for red-rock formations and hiking.', 1, 'Almaty', 0.77),
('Issyk Lake (near Almaty)', 'Озеро Иссык', 'Ыссик көлі', 'Popular mountain lake and resort area near Almaty for picnics and walks.', 1, 'Almaty', 0.46),
('Kolsai Lakes (regional day-trip)', 'Кольсайские озера', 'Қольсай көлдері', 'Chain of alpine lakes in the region — commonly visited on longer excursions from Almaty.', 1, 'Almaty', 0.69),
('Altyn-Emel National Park (regional)', 'Национальный парк Алтын-Эмель', 'Алтын-Эмел ұлттық паркі', 'Large protected area in the region with unique geological and desert-steppe features (longer trip from Almaty).', 1, 'Almaty', 0.51),
-- Astana attractions
('Bayterek Tower', 'Байтерек', 'Бәйтерек', 'Symbolic tower in central Astana offering panoramic views—an iconic modern landmark of the city.', 13, 'Astana', 0.97),
('Khan Shatyr Entertainment Centre', 'Кхан-Шатыр', 'Хан шатыр', 'Futuristic tent-shaped shopping and entertainment mall with indoor beach and attractions.', 14, 'Astana', 0.91),
('Palace of Peace and Reconciliation', 'Дворец мира и согласия', 'Тақырыптық шығыстық-ғұнтық сарайы (Пирамида)', 'Pyramid-shaped building by Norman Foster that hosts cultural events and interfaith dialogues.', 15, 'Astana', 0.88),
('Hazret Sultan Mosque', 'Мечеть Хазрет Султан', 'Хазрет Сұлтан мешіті', 'One of the largest mosques in Central Asia, an imposing modern mosque complex.', 7, 'Astana', 0.89),
('National Museum of Kazakhstan (Astana)', 'Национальный музей Казахстана', 'Қазақстан Ұлттық музейі', 'Large modern museum presenting the history, archaeology and culture of Kazakhstan.', 5, 'Astana', 0.92),
('Astana Opera House', 'Астана Опера', 'Астана Опера театры', 'Prestigious opera and ballet theatre hosting national and international productions.', 8, 'Astana', 0.86),
('Nur-Astana Mosque', 'Нур-Астана мечеть', 'Нұр-Астана мешіті', 'Another notable mosque in Astana notable for its design and community role.', 7, 'Astana', 0.63),
('Atameken Ethno-Memorial Complex', 'Атамекен', 'Атамекен', 'Open-air miniature park with models representing Kazakhstan''s regions and landmarks.', 5, 'Astana', 0.74),
('Nur Alem (EXPO Sphere)', 'Нур Алем (шар EXPO)', 'Нұр Әлем (EXPO сферасы)', 'Futuristic spherical pavilion from EXPO 2017 that now houses exhibitions and a science museum.', 5, 'Astana', 0.80),
('Kazakh Eli Monument', 'Памятник Казах Ели', 'Қазақ Елі монументі', 'Tall column crowned with the mythical bird Samruk, symbolizing Kazakhstan''s independence.', 16, 'Astana', 0.76),
('Palace of Independence', 'Дворец независимости', 'Тәуелсіздік сарайы', 'Modern governmental building used for state ceremonies, exhibitions and forums.', 15, 'Astana', 0.68),
('Nurzhol Boulevard', 'Нуржол бульвар', 'Нұржол бульвары', 'Prominent pedestrian boulevard in Astana lined with modern architecture and monuments.', 11, 'Astana', 0.73),
('Duman Entertainment Centre', 'Думан', 'Думан ойын-сауық орталығы', 'Aquarium and entertainment complex popular with families (planetarium and shows sometimes available).', 17, 'Astana', 0.50),
('Ak Orda Presidential Palace (view from outside)', 'Ак Орда', 'Ақорда', 'Presidential residence and a modern landmark — typically viewed from the embankment across the river.', 18, 'Astana', 0.64),
('State Museum of the First President of Kazakhstan (Astana branch)', 'Музей Первого Президента', 'Қазақстан Президентінің бірінші қорық-музейі', 'Exhibition space covering modern Kazakh political history and the first president''s legacy.', 5, 'Astana', 0.55),
('Central Concert Hall', 'Центральный концертный зал', 'Орталық концерт залы', 'Modern concert venue for large cultural events and performances.', 8, 'Astana', 0.60),
('National Academic Library of Kazakhstan', 'Национальная академическая библиотека Казахстана', 'Қазақстан Ұлттық академиялық кітапханасы', 'Major library and research center with exhibitions and cultural programming.', 8, 'Astana', 0.41),

-- Shymkent attractions
('Shymkent Central Park (Park of Culture and Recreation)', 'Центральный парк Шымкента', 'Шымкент орталық саябағы', 'Large city park with rides, walking paths and family-friendly facilities.', 10, 'Shymkent', 0.72),
('Shymkent Bazaar (Central Market)', 'Шымкентский базар (Центральный рынок)', 'Шымкент базары (Орталық нарық)', 'Traditional bazaar offering regional produce, foods and local goods — very lively and local.', 4, 'Shymkent', 0.78),
('South Kazakhstan Regional Museum (Shymkent Historical Museum)', 'Южно-Казахстанский областной исторический музей', 'Оңтүстік Қазақстан облыстық тарихи-өлкетану мұражайы', 'Large regional museum documenting the area''s archeology, history and ethnography.', 5, 'Shymkent', 0.65),
('Ordabasy Monument', 'Памятник Ордабасы', 'Ордабасы ескерткіші', 'Historic monument commemorating the meetings of Kazakh leaders at Ordabasy — a city landmark.', 3, 'Shymkent', 0.58),
('Ken Baba Park', 'Парк Кен Баба', 'Кен Баба саябағы', 'Popular family park with playgrounds, eateries and small amusement rides.', 10, 'Shymkent', 0.49),
('Shymkent Zoo', 'Шымкентский зоопарк', 'Шымкент хайуанаттар бағы', 'Regional zoo home to local and exotic animals; family attraction.', 9, 'Shymkent', 0.44),
('Independence Park (Shymkent)', 'Парк Независимости', 'Тәуелсіздік саябағы', 'Public green space commemorating Kazakhstan''s independence with monuments and walkways.', 10, 'Shymkent', 0.40),
('Sayram-Ugam National Park (access from Shymkent region)', 'Национальный парк Сайрам-Угам', 'Сайрам-Уғам ұлттық паркі', 'Protected area in the region with mountain landscapes, hiking and nature activities (regionally accessed from Shymkent).', 1, 'Shymkent', 0.62),
('Koshkar-Ata River & Riverside Walks', 'Река Кошкар-Ата и набережная', 'Қошқар-Ата өзені және жағалауы', 'Local river area used for walks and small recreational spaces within Shymkent.', 1, 'Shymkent', 0.28),
('Shymkent Regional Philharmonic / Cultural Centre', 'Филармония Шымкента / культурный центр', 'Шымкент филармониясы / мәдени орталығы', 'Venue for music, performances and cultural events in the city.', 8, 'Shymkent', 0.33),
('Central Mosque of Shymkent', 'Центральная мечеть Шымкента', 'Шымкент орталық мешіті', 'Major mosque serving the city''s Muslim community, notable for architecture and civic events.', 7, 'Shymkent', 0.36),
('Archeological sites and local historical sights (Sayram district)', 'Археологические памятники района Сайрам', 'Сайрам ауданындағы археологиялық орындар', 'Nearby historical and archaeological attractions in the Sayram area with ancient ruins and museums.', 3, 'Shymkent', 0.27)

ON CONFLICT DO NOTHING;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
TRUNCATE attractions;
-- +goose StatementEnd