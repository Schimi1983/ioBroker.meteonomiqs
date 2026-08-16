/**
 * Translations for the state and channel labels.
 *
 * The object structure check of the ioBroker repository ([W1001]) expects every
 * `common.name` to carry all eleven languages the platform supports, not just
 * English and German. The labels are built in code rather than read from a JSON
 * file, so they live here instead of in `admin/i18n`.
 *
 * The English label doubles as the lookup key — `FieldDef.name` is passed in
 * unchanged, which keeps the field tables free of translation noise.
 */

/**
 * The eleven language codes ioBroker supports, in the order the platform lists
 * them. `ioBroker.Translated` is `{ en: string } & { [lang in Languages]?: string }`,
 * so a plain `Record<string, string>` is *not* assignable to it: an index
 * signature does not satisfy the declared, required `en` property.
 */
export const LANGUAGES = ['en', 'de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn'] as const;

/** One of the eleven ioBroker language codes. */
export type Language = (typeof LANGUAGES)[number];

/**
 * Translated label carrying all eleven languages.
 *
 * Every language is required, which makes the type assignable to
 * `ioBroker.StringOrTranslated` and satisfies the object structure check
 * ([W1001]) that wants a complete translation on every `common.name`.
 */
export type Translated = Record<Language, string>;

/**
 * Builds a translation map by asking the callback for every language.
 *
 * The keys are written out instead of filled in a loop so that TypeScript can
 * see that the result really covers all eleven languages.
 *
 * @param build Returns the wording for one language.
 * @returns The complete translation map.
 */
function forEachLanguage(build: (lang: Language) => string): Translated {
    return {
        en: build('en'),
        de: build('de'),
        ru: build('ru'),
        pt: build('pt'),
        nl: build('nl'),
        fr: build('fr'),
        it: build('it'),
        es: build('es'),
        pl: build('pl'),
        uk: build('uk'),
        'zh-cn': build('zh-cn'),
    };
}

/**
 * Builds a translated label from the eleven values in platform order.
 *
 * @param en English.
 * @param de German.
 * @param ru Russian.
 * @param pt Portuguese.
 * @param nl Dutch.
 * @param fr French.
 * @param it Italian.
 * @param es Spanish.
 * @param pl Polish.
 * @param uk Ukrainian.
 * @param zh Simplified Chinese.
 * @returns The translation map.
 */
function tr(en: string, de: string, ru: string, pt: string, nl: string, fr: string, it: string, es: string, pl: string, uk: string, zh: string): Translated {
    return { en, de, ru, pt, nl, fr, it, es, pl, uk, 'zh-cn': zh };
}

/** Field and info-state labels, keyed by their English wording. */
const LABELS: Record<string, Translated> = {
    // ---------------------------------------------------------------- weather
    'Air pressure': tr('Air pressure', 'Luftdruck', 'Атмосферное давление', 'Pressão atmosférica', 'Luchtdruk', 'Pression atmosphérique', 'Pressione atmosferica', 'Presión atmosférica', 'Ciśnienie atmosferyczne', 'Атмосферний тиск', '气压'),
    'Average temperature': tr(
        'Average temperature',
        'Durchschnittstemperatur',
        'Средняя температура',
        'Temperatura média',
        'Gemiddelde temperatuur',
        'Température moyenne',
        'Temperatura media',
        'Temperatura media',
        'Średnia temperatura',
        'Середня температура',
        '平均气温',
    ),
    'Cloud cover': tr('Cloud cover', 'Bewölkung', 'Облачность', 'Nebulosidade', 'Bewolking', 'Nébulosité', 'Nuvolosità', 'Nubosidad', 'Zachmurzenie', 'Хмарність', '云量'),
    Date: tr('Date', 'Datum', 'Дата', 'Data', 'Datum', 'Date', 'Data', 'Fecha', 'Data', 'Дата', '日期'),
    'Date (ISO)': tr('Date (ISO)', 'Datum (ISO)', 'Дата (ISO)', 'Data (ISO)', 'Datum (ISO)', 'Date (ISO)', 'Data (ISO)', 'Fecha (ISO)', 'Data (ISO)', 'Дата (ISO)', '日期 (ISO)'),
    'Dew point': tr('Dew point', 'Taupunkt', 'Точка росы', 'Ponto de orvalho', 'Dauwpunt', 'Point de rosée', 'Punto di rugiada', 'Punto de rocío', 'Punkt rosy', 'Точка роси', '露点'),
    'Feels like': tr('Feels like', 'Gefühlt', 'Ощущается как', 'Sensação térmica', 'Gevoelstemperatuur', 'Ressenti', 'Temperatura percepita', 'Sensación térmica', 'Temperatura odczuwalna', 'Відчувається як', '体感温度'),
    'Feels like max.': tr(
        'Feels like max.',
        'Gefühlt max.',
        'Ощущается макс.',
        'Sensação térmica máx.',
        'Gevoelstemperatuur max.',
        'Ressenti max.',
        'Percepita max.',
        'Sensación térmica máx.',
        'Odczuwalna maks.',
        'Відчувається макс.',
        '体感温度最高',
    ),
    'Feels like min.': tr('Feels like min.', 'Gefühlt min.', 'Ощущается мин.', 'Sensação térmica mín.', 'Gevoelstemperatuur min.', 'Ressenti min.', 'Percepita min.', 'Sensación térmica mín.', 'Odczuwalna min.', 'Відчувається мін.', '体感温度最低'),
    'Fresh snow': tr('Fresh snow', 'Neuschnee', 'Свежий снег', 'Neve fresca', 'Verse sneeuw', 'Neige fraîche', 'Neve fresca', 'Nieve fresca', 'Świeży śnieg', 'Свіжий сніг', '新雪'),
    'Fresh snow max.': tr('Fresh snow max.', 'Neuschnee max.', 'Свежий снег макс.', 'Neve fresca máx.', 'Verse sneeuw max.', 'Neige fraîche max.', 'Neve fresca max.', 'Nieve fresca máx.', 'Świeży śnieg maks.', 'Свіжий сніг макс.', '新雪最大'),
    'Fresh snow min.': tr('Fresh snow min.', 'Neuschnee min.', 'Свежий снег мин.', 'Neve fresca mín.', 'Verse sneeuw min.', 'Neige fraîche min.', 'Neve fresca min.', 'Nieve fresca mín.', 'Świeży śnieg min.', 'Свіжий сніг мін.', '新雪最小'),
    'Icon URL': tr('Icon URL', 'Icon-URL', 'URL значка', 'URL do ícone', 'Icoon-URL', "URL de l'icône", "URL dell'icona", 'URL del icono', 'URL ikony', 'URL значка', '图标 URL'),
    'Max. temperature': tr('Max. temperature', 'Max. Temperatur', 'Макс. температура', 'Temperatura máx.', 'Max. temperatuur', 'Température max.', 'Temperatura max.', 'Temperatura máx.', 'Temperatura maks.', 'Макс. температура', '最高气温'),
    'Max. temperature today': tr(
        'Max. temperature today',
        'Max. Temperatur heute',
        'Макс. температура сегодня',
        'Temperatura máx. hoje',
        'Max. temperatuur vandaag',
        "Température max. aujourd'hui",
        'Temperatura max. oggi',
        'Temperatura máx. hoy',
        'Temperatura maks. dziś',
        'Макс. температура сьогодні',
        '今日最高气温',
    ),
    'Max. wind speed': tr(
        'Max. wind speed',
        'Max. Windgeschwindigkeit',
        'Макс. скорость ветра',
        'Velocidade máx. do vento',
        'Max. windsnelheid',
        'Vitesse max. du vent',
        'Velocità max. del vento',
        'Velocidad máx. del viento',
        'Maks. prędkość wiatru',
        'Макс. швидкість вітру',
        '最大风速',
    ),
    'Min. temperature': tr('Min. temperature', 'Min. Temperatur', 'Мин. температура', 'Temperatura mín.', 'Min. temperatuur', 'Température min.', 'Temperatura min.', 'Temperatura mín.', 'Temperatura min.', 'Мін. температура', '最低气温'),
    'Min. temperature today': tr(
        'Min. temperature today',
        'Min. Temperatur heute',
        'Мин. температура сегодня',
        'Temperatura mín. hoje',
        'Min. temperatuur vandaag',
        "Température min. aujourd'hui",
        'Temperatura min. oggi',
        'Temperatura mín. hoy',
        'Temperatura min. dziś',
        'Мін. температура сьогодні',
        '今日最低气温',
    ),
    Night: tr('Night', 'Nacht', 'Ночь', 'Noite', 'Nacht', 'Nuit', 'Notte', 'Noche', 'Noc', 'Ніч', '夜间'),
    'Precipitation amount': tr(
        'Precipitation amount',
        'Niederschlagsmenge',
        'Количество осадков',
        'Quantidade de precipitação',
        'Neerslaghoeveelheid',
        'Quantité de précipitations',
        'Quantità di precipitazioni',
        'Cantidad de precipitación',
        'Suma opadów',
        'Кількість опадів',
        '降水量',
    ),
    'Precipitation class (0-3)': tr(
        'Precipitation class (0-3)',
        'Niederschlagsklasse (0-3)',
        'Класс осадков (0-3)',
        'Classe de precipitação (0-3)',
        'Neerslagklasse (0-3)',
        'Classe de précipitations (0-3)',
        'Classe di precipitazioni (0-3)',
        'Clase de precipitación (0-3)',
        'Klasa opadów (0-3)',
        'Клас опадів (0-3)',
        '降水等级 (0-3)',
    ),
    'Precipitation probability': tr(
        'Precipitation probability',
        'Regenrisiko',
        'Вероятность осадков',
        'Probabilidade de precipitação',
        'Neerslagkans',
        'Probabilité de précipitations',
        'Probabilità di precipitazioni',
        'Probabilidad de precipitación',
        'Prawdopodobieństwo opadów',
        'Ймовірність опадів',
        '降水概率',
    ),
    'Rainy hours': tr('Rainy hours', 'Regenstunden', 'Часы с дождём', 'Horas de chuva', 'Uren met regen', 'Heures de pluie', 'Ore di pioggia', 'Horas de lluvia', 'Godziny z deszczem', 'Години з дощем', '降雨小时数'),
    'Relative humidity': tr(
        'Relative humidity',
        'Relative Feuchte',
        'Относительная влажность',
        'Humidade relativa',
        'Relatieve vochtigheid',
        'Humidité relative',
        'Umidità relativa',
        'Humedad relativa',
        'Wilgotność względna',
        'Відносна вологість',
        '相对湿度',
    ),
    'Significant wind': tr('Significant wind', 'Signifikanter Wind', 'Значительный ветер', 'Vento significativo', 'Significante wind', 'Vent significatif', 'Vento significativo', 'Viento significativo', 'Silny wiatr', 'Значний вітер', '显著大风'),
    'Snow (water equivalent)': tr(
        'Snow (water equivalent)',
        'Schnee (Wasseräquivalent)',
        'Снег (водный эквивалент)',
        'Neve (equivalente em água)',
        'Sneeuw (waterequivalent)',
        'Neige (équivalent en eau)',
        'Neve (equivalente in acqua)',
        'Nieve (equivalente en agua)',
        'Śnieg (ekwiwalent wodny)',
        'Сніг (водний еквівалент)',
        '降雪（水当量）',
    ),
    'Snow line': tr('Snow line', 'Schneefallgrenze', 'Снеговая линия', 'Cota de neve', 'Sneeuwgrens', 'Limite pluie-neige', 'Quota neve', 'Cota de nieve', 'Granica śniegu', 'Снігова лінія', '雪线'),
    'Snow line max.': tr(
        'Snow line max.',
        'Schneefallgrenze max.',
        'Снеговая линия макс.',
        'Cota de neve máx.',
        'Sneeuwgrens max.',
        'Limite pluie-neige max.',
        'Quota neve max.',
        'Cota de nieve máx.',
        'Granica śniegu maks.',
        'Снігова лінія макс.',
        '雪线最高',
    ),
    'Snow line min.': tr(
        'Snow line min.',
        'Schneefallgrenze min.',
        'Снеговая линия мин.',
        'Cota de neve mín.',
        'Sneeuwgrens min.',
        'Limite pluie-neige min.',
        'Quota neve min.',
        'Cota de nieve mín.',
        'Granica śniegu min.',
        'Снігова лінія мін.',
        '雪线最低',
    ),
    'Sunshine hours': tr('Sunshine hours', 'Sonnenstunden', 'Часы солнечного сияния', 'Horas de sol', 'Zonuren', "Heures d'ensoleillement", 'Ore di sole', 'Horas de sol', 'Godziny słoneczne', 'Години сонця', '日照时数'),
    Temperature: tr('Temperature', 'Temperatur', 'Температура', 'Temperatura', 'Temperatuur', 'Température', 'Temperatura', 'Temperatura', 'Temperatura', 'Температура', '气温'),
    'Temperature max.': tr('Temperature max.', 'Temperatur max.', 'Температура макс.', 'Temperatura máx.', 'Temperatuur max.', 'Température max.', 'Temperatura max.', 'Temperatura máx.', 'Temperatura maks.', 'Температура макс.', '气温最高'),
    'Temperature min.': tr('Temperature min.', 'Temperatur min.', 'Температура мин.', 'Temperatura mín.', 'Temperatuur min.', 'Température min.', 'Temperatura min.', 'Temperatura mín.', 'Temperatura min.', 'Температура мін.', '气温最低'),
    'Time (local)': tr('Time (local)', 'Uhrzeit (Ortszeit)', 'Время (местное)', 'Hora (local)', 'Tijd (lokaal)', 'Heure (locale)', 'Ora (locale)', 'Hora (local)', 'Godzina (lokalna)', 'Час (місцевий)', '时间（当地）'),
    'Timestamp (UTC)': tr(
        'Timestamp (UTC)',
        'Zeitstempel (UTC)',
        'Метка времени (UTC)',
        'Data/hora (UTC)',
        'Tijdstempel (UTC)',
        'Horodatage (UTC)',
        'Marca temporale (UTC)',
        'Marca de tiempo (UTC)',
        'Znacznik czasu (UTC)',
        'Мітка часу (UTC)',
        '时间戳 (UTC)',
    ),
    'Value up to date': tr('Value up to date', 'Wert aktuell', 'Значение актуально', 'Valor atualizado', 'Waarde actueel', 'Valeur à jour', 'Valore aggiornato', 'Valor actualizado', 'Wartość aktualna', 'Значення актуальне', '数值为最新'),
    'Warning active': tr('Warning active', 'Warnung aktiv', 'Предупреждение активно', 'Aviso ativo', 'Waarschuwing actief', 'Alerte active', 'Allerta attiva', 'Aviso activo', 'Ostrzeżenie aktywne', 'Попередження активне', '警报生效'),
    'Warning group': tr('Warning group', 'Warnung Gruppe', 'Группа предупреждения', 'Grupo do aviso', 'Waarschuwingsgroep', "Groupe d'alerte", 'Gruppo di allerta', 'Grupo de aviso', 'Grupa ostrzeżenia', 'Група попередження', '警报类别'),
    'Warning severity': tr(
        'Warning severity',
        'Warnung Schweregrad',
        'Уровень предупреждения',
        'Gravidade do aviso',
        'Ernst van de waarschuwing',
        "Gravité de l'alerte",
        "Gravità dell'allerta",
        'Gravedad del aviso',
        'Poziom ostrzeżenia',
        'Рівень попередження',
        '警报级别',
    ),
    'Warning severity (0-4)': tr(
        'Warning severity (0-4)',
        'Warnung Schweregrad (0-4)',
        'Уровень предупреждения (0-4)',
        'Gravidade do aviso (0-4)',
        'Ernst van de waarschuwing (0-4)',
        "Gravité de l'alerte (0-4)",
        "Gravità dell'allerta (0-4)",
        'Gravedad del aviso (0-4)',
        'Poziom ostrzeżenia (0-4)',
        'Рівень попередження (0-4)',
        '警报级别 (0-4)',
    ),
    'Warning text': tr('Warning text', 'Warnung Text', 'Текст предупреждения', 'Texto do aviso', 'Waarschuwingstekst', "Texte de l'alerte", "Testo dell'allerta", 'Texto del aviso', 'Treść ostrzeżenia', 'Текст попередження', '警报内容'),
    Weather: tr('Weather', 'Wetter', 'Погода', 'Tempo', 'Weer', 'Météo', 'Meteo', 'Tiempo', 'Pogoda', 'Погода', '天气'),
    'Weather code': tr('Weather code', 'Wetter-Code', 'Код погоды', 'Código do tempo', 'Weercode', 'Code météo', 'Codice meteo', 'Código del tiempo', 'Kod pogody', 'Код погоди', '天气代码'),
    Weekday: tr('Weekday', 'Wochentag', 'День недели', 'Dia da semana', 'Weekdag', 'Jour de la semaine', 'Giorno della settimana', 'Día de la semana', 'Dzień tygodnia', 'День тижня', '星期'),
    'Wind direction': tr('Wind direction', 'Windrichtung', 'Направление ветра', 'Direção do vento', 'Windrichting', 'Direction du vent', 'Direzione del vento', 'Dirección del viento', 'Kierunek wiatru', 'Напрямок вітру', '风向'),
    'Wind direction (degrees)': tr(
        'Wind direction (degrees)',
        'Windrichtung (Grad)',
        'Направление ветра (градусы)',
        'Direção do vento (graus)',
        'Windrichting (graden)',
        'Direction du vent (degrés)',
        'Direzione del vento (gradi)',
        'Dirección del viento (grados)',
        'Kierunek wiatru (stopnie)',
        'Напрямок вітру (градуси)',
        '风向（度）',
    ),
    'Wind direction (short)': tr(
        'Wind direction (short)',
        'Windrichtung (kurz)',
        'Направление ветра (кратко)',
        'Direção do vento (abrev.)',
        'Windrichting (kort)',
        'Direction du vent (abrégé)',
        'Direzione del vento (breve)',
        'Dirección del viento (abrev.)',
        'Kierunek wiatru (skrót)',
        'Напрямок вітру (скорочено)',
        '风向（缩写）',
    ),
    'Wind gusts': tr('Wind gusts', 'Windböen', 'Порывы ветра', 'Rajadas de vento', 'Windstoten', 'Rafales de vent', 'Raffiche di vento', 'Ráfagas de viento', 'Porywy wiatru', 'Пориви вітру', '阵风'),
    'Wind speed': tr('Wind speed', 'Windgeschwindigkeit', 'Скорость ветра', 'Velocidade do vento', 'Windsnelheid', 'Vitesse du vent', 'Velocità del vento', 'Velocidad del viento', 'Prędkość wiatru', 'Швидкість вітру', '风速'),
    'Wind speed (avg)': tr(
        'Wind speed (avg)',
        'Windgeschwindigkeit (Ø)',
        'Скорость ветра (сред.)',
        'Velocidade do vento (méd.)',
        'Windsnelheid (gem.)',
        'Vitesse du vent (moy.)',
        'Velocità del vento (media)',
        'Velocidad del viento (prom.)',
        'Prędkość wiatru (śr.)',
        'Швидкість вітру (сер.)',
        '风速（平均）',
    ),

    // ------------------------------------------------------------ sun and moon
    Dawn: tr('Dawn', 'Morgendämmerung', 'Рассвет', 'Amanhecer', 'Ochtendschemering', 'Aube', 'Alba', 'Amanecer', 'Świt', 'Світанок', '黎明'),
    'Day length': tr('Day length', 'Tageslänge', 'Продолжительность дня', 'Duração do dia', 'Daglengte', 'Durée du jour', 'Durata del giorno', 'Duración del día', 'Długość dnia', 'Тривалість дня', '昼长'),
    Dusk: tr('Dusk', 'Abenddämmerung', 'Сумерки', 'Crepúsculo', 'Avondschemering', 'Crépuscule', 'Crepuscolo', 'Anochecer', 'Zmierzch', 'Сутінки', '黄昏'),
    'Moon phase': tr('Moon phase', 'Mondphase', 'Фаза Луны', 'Fase da Lua', 'Maanfase', 'Phase de la Lune', 'Fase lunare', 'Fase lunar', 'Faza Księżyca', 'Фаза Місяця', '月相'),
    'Moon phase (1-8)': tr('Moon phase (1-8)', 'Mondphase (1-8)', 'Фаза Луны (1-8)', 'Fase da Lua (1-8)', 'Maanfase (1-8)', 'Phase de la Lune (1-8)', 'Fase lunare (1-8)', 'Fase lunar (1-8)', 'Faza Księżyca (1-8)', 'Фаза Місяця (1-8)', '月相 (1-8)'),
    'Moon zodiac': tr(
        'Moon zodiac',
        'Mond-Tierkreiszeichen',
        'Знак зодиака Луны',
        'Signo zodiacal da Lua',
        'Dierenriemteken van de maan',
        'Signe zodiacal de la Lune',
        'Segno zodiacale lunare',
        'Signo zodiacal lunar',
        'Znak zodiaku Księżyca',
        'Знак зодіаку Місяця',
        '月亮星座',
    ),
    'Moon zodiac (1-12)': tr(
        'Moon zodiac (1-12)',
        'Mond-Tierkreiszeichen (1-12)',
        'Знак зодиака Луны (1-12)',
        'Signo zodiacal da Lua (1-12)',
        'Dierenriemteken van de maan (1-12)',
        'Signe zodiacal de la Lune (1-12)',
        'Segno zodiacale lunare (1-12)',
        'Signo zodiacal lunar (1-12)',
        'Znak zodiaku Księżyca (1-12)',
        'Знак зодіаку Місяця (1-12)',
        '月亮星座 (1-12)',
    ),
    Moonrise: tr('Moonrise', 'Mondaufgang', 'Восход Луны', 'Nascer da Lua', 'Maansopkomst', 'Lever de la Lune', 'Sorgere della Luna', 'Salida de la Luna', 'Wschód Księżyca', 'Схід Місяця', '月出'),
    Moonset: tr('Moonset', 'Monduntergang', 'Заход Луны', 'Pôr da Lua', 'Maansondergang', 'Coucher de la Lune', 'Tramonto della Luna', 'Puesta de la Luna', 'Zachód Księżyca', 'Захід Місяця', '月落'),
    'Solar noon': tr('Solar noon', 'Sonnenhöchststand', 'Солнечный полдень', 'Meio-dia solar', 'Zonnehoogtepunt', 'Midi solaire', 'Mezzogiorno solare', 'Mediodía solar', 'Południe słoneczne', 'Сонячний полудень', '太阳正午'),
    Sunrise: tr('Sunrise', 'Sonnenaufgang', 'Восход солнца', 'Nascer do sol', 'Zonsopkomst', 'Lever du soleil', 'Alba', 'Amanecer', 'Wschód słońca', 'Схід сонця', '日出'),
    'Sunrise (ISO)': tr('Sunrise (ISO)', 'Sonnenaufgang (ISO)', 'Восход солнца (ISO)', 'Nascer do sol (ISO)', 'Zonsopkomst (ISO)', 'Lever du soleil (ISO)', 'Alba (ISO)', 'Amanecer (ISO)', 'Wschód słońca (ISO)', 'Схід сонця (ISO)', '日出 (ISO)'),
    Sunset: tr('Sunset', 'Sonnenuntergang', 'Заход солнца', 'Pôr do sol', 'Zonsondergang', 'Coucher du soleil', 'Tramonto', 'Puesta del sol', 'Zachód słońca', 'Захід сонця', '日落'),
    'Sunset (ISO)': tr(
        'Sunset (ISO)',
        'Sonnenuntergang (ISO)',
        'Заход солнца (ISO)',
        'Pôr do sol (ISO)',
        'Zonsondergang (ISO)',
        'Coucher du soleil (ISO)',
        'Tramonto (ISO)',
        'Puesta del sol (ISO)',
        'Zachód słońca (ISO)',
        'Захід сонця (ISO)',
        '日落 (ISO)',
    ),

    // ------------------------------------------------------------- info states
    'Last update': tr('Last update', 'Letztes Update', 'Последнее обновление', 'Última atualização', 'Laatste update', 'Dernière mise à jour', 'Ultimo aggiornamento', 'Última actualización', 'Ostatnia aktualizacja', 'Останнє оновлення', '最后更新'),
    'Last update (timestamp)': tr(
        'Last update (timestamp)',
        'Letztes Update (Zeitstempel)',
        'Последнее обновление (метка времени)',
        'Última atualização (data/hora)',
        'Laatste update (tijdstempel)',
        'Dernière mise à jour (horodatage)',
        'Ultimo aggiornamento (marca temporale)',
        'Última actualización (marca de tiempo)',
        'Ostatnia aktualizacja (znacznik czasu)',
        'Останнє оновлення (мітка часу)',
        '最后更新（时间戳）',
    ),
    'Requests this month': tr(
        'Requests this month',
        'Anfragen Monat',
        'Запросов за месяц',
        'Pedidos este mês',
        'Aanvragen deze maand',
        'Requêtes ce mois-ci',
        'Richieste questo mese',
        'Peticiones este mes',
        'Zapytania w tym miesiącu',
        'Запитів цього місяця',
        '本月请求数',
    ),
    'Billing month': tr('Billing month', 'Abrechnungsmonat', 'Расчётный месяц', 'Mês de faturação', 'Factuurmaand', 'Mois de facturation', 'Mese di fatturazione', 'Mes de facturación', 'Miesiąc rozliczeniowy', 'Розрахунковий місяць', '计费月份'),
    'Requests today': tr('Requests today', 'Anfragen heute', 'Запросов сегодня', 'Pedidos hoje', 'Aanvragen vandaag', "Requêtes aujourd'hui", 'Richieste oggi', 'Peticiones hoy', 'Zapytania dzisiaj', 'Запитів сьогодні', '今日请求数'),
    'Counting day': tr('Counting day', 'Zähltag', 'День отсчёта', 'Dia de contagem', 'Teldag', 'Jour de comptage', 'Giorno di conteggio', 'Día de recuento', 'Dzień zliczania', 'День підрахунку', '计数日'),
    'Remaining requests': tr(
        'Remaining requests',
        'Verbleibende Anfragen',
        'Осталось запросов',
        'Pedidos restantes',
        'Resterende aanvragen',
        'Requêtes restantes',
        'Richieste rimanenti',
        'Peticiones restantes',
        'Pozostałe zapytania',
        'Залишилось запитів',
        '剩余请求数',
    ),
    Status: tr('Status', 'Status', 'Статус', 'Estado', 'Status', 'Statut', 'Stato', 'Estado', 'Status', 'Статус', '状态'),
    'Last error': tr('Last error', 'Letzter Fehler', 'Последняя ошибка', 'Último erro', 'Laatste fout', 'Dernière erreur', 'Ultimo errore', 'Último error', 'Ostatni błąd', 'Остання помилка', '最后错误'),
    'Forecast issued (API)': tr(
        'Forecast issued (API)',
        'Vorhersage erstellt (API)',
        'Прогноз создан (API)',
        'Previsão emitida (API)',
        'Verwachting opgesteld (API)',
        'Prévision émise (API)',
        'Previsione emessa (API)',
        'Pronóstico emitido (API)',
        'Prognoza wydana (API)',
        'Прогноз створено (API)',
        '预报发布时间 (API)',
    ),
    'Next API update': tr(
        'Next API update',
        'Nächstes API-Update',
        'Следующее обновление API',
        'Próxima atualização da API',
        'Volgende API-update',
        "Prochaine mise à jour de l'API",
        'Prossimo aggiornamento API',
        'Próxima actualización de la API',
        'Następna aktualizacja API',
        'Наступне оновлення API',
        '下次 API 更新',
    ),
    'Location in use': tr(
        'Location in use',
        'Verwendeter Standort',
        'Используемое местоположение',
        'Localização utilizada',
        'Gebruikte locatie',
        'Emplacement utilisé',
        'Posizione utilizzata',
        'Ubicación utilizada',
        'Używana lokalizacja',
        'Використане розташування',
        '使用的位置',
    ),
    'Time zone of the location': tr(
        'Time zone of the location',
        'Zeitzone des Standorts',
        'Часовой пояс местоположения',
        'Fuso horário da localização',
        'Tijdzone van de locatie',
        'Fuseau horaire du lieu',
        'Fuso orario della posizione',
        'Zona horaria de la ubicación',
        'Strefa czasowa lokalizacji',
        'Часовий пояс розташування',
        '位置时区',
    ),
    Elevation: tr('Elevation', 'Höhe über NN', 'Высота над уровнем моря', 'Altitude', 'Hoogte', 'Altitude', 'Altitudine', 'Altitud', 'Wysokość', 'Висота над рівнем моря', '海拔'),
    'Update now': tr('Update now', 'Jetzt aktualisieren', 'Обновить сейчас', 'Atualizar agora', 'Nu bijwerken', 'Mettre à jour maintenant', 'Aggiorna ora', 'Actualizar ahora', 'Aktualizuj teraz', 'Оновити зараз', '立即更新'),
    'Reset monthly counter': tr(
        'Reset monthly counter',
        'Monatszähler zurücksetzen',
        'Сбросить месячный счётчик',
        'Repor contador mensal',
        'Maandteller resetten',
        'Réinitialiser le compteur mensuel',
        'Azzera contatore mensile',
        'Restablecer contador mensual',
        'Zresetuj licznik miesięczny',
        'Скинути місячний лічильник',
        '重置月度计数器',
    ),

    // -------------------------------------------------- channels and specials
    Information: tr('Information', 'Informationen', 'Информация', 'Informação', 'Informatie', 'Informations', 'Informazioni', 'Información', 'Informacje', 'Інформація', '信息'),
    'Current hour': tr('Current hour', 'Aktuelle Stunde', 'Текущий час', 'Hora atual', 'Huidig uur', 'Heure actuelle', 'Ora attuale', 'Hora actual', 'Bieżąca godzina', 'Поточна година', '当前小时'),
    'Day sections': tr('Day sections', 'Tagesabschnitte', 'Части дня', 'Períodos do dia', 'Dagdelen', 'Périodes de la journée', 'Fasce della giornata', 'Franjas del día', 'Pory dnia', 'Частини дня', '时段'),
    'Sun & moon': tr('Sun & moon', 'Sonne & Mond', 'Солнце и Луна', 'Sol e Lua', 'Zon & maan', 'Soleil et Lune', 'Sole e Luna', 'Sol y Luna', 'Słońce i Księżyc', 'Сонце та Місяць', '日月'),
    Hourly: tr('Hourly', 'Stündlich', 'Почасово', 'Por hora', 'Per uur', 'Horaire', 'Orario', 'Por horas', 'Godzinowo', 'Погодинно', '逐小时'),
    'Forecast (JSON)': tr('Forecast (JSON)', 'Vorhersage (JSON)', 'Прогноз (JSON)', 'Previsão (JSON)', 'Verwachting (JSON)', 'Prévisions (JSON)', 'Previsioni (JSON)', 'Pronóstico (JSON)', 'Prognoza (JSON)', 'Прогноз (JSON)', '预报 (JSON)'),
    'Hourly values (JSON)': tr(
        'Hourly values (JSON)',
        'Stundenwerte (JSON)',
        'Почасовые значения (JSON)',
        'Valores horários (JSON)',
        'Uurwaarden (JSON)',
        'Valeurs horaires (JSON)',
        'Valori orari (JSON)',
        'Valores horarios (JSON)',
        'Wartości godzinowe (JSON)',
        'Погодинні значення (JSON)',
        '逐小时数值 (JSON)',
    ),
    'Source state': tr('Source state', 'Quell-Datenpunkt', 'Исходное состояние', 'Estado de origem', 'Bronstate', 'État source', 'Stato di origine', 'Estado de origen', 'Stan źródłowy', 'Джерельний стан', '源数据点'),
    'Last copied': tr('Last copied', 'Zuletzt übernommen', 'Последнее копирование', 'Última cópia', 'Laatst overgenomen', 'Dernière reprise', 'Ultima copia', 'Última copia', 'Ostatnio skopiowano', 'Востаннє скопійовано', '最后复制时间'),
};

/** Day-section labels, keyed by the segment id used in the object tree. */
const SEGMENT_LABELS: Record<string, Translated> = {
    morning: tr('Morning', 'Morgen', 'Утро', 'Manhã', 'Ochtend', 'Matin', 'Mattina', 'Mañana', 'Rano', 'Ранок', '上午'),
    afternoon: tr('Afternoon', 'Mittag', 'День', 'Tarde', 'Middag', 'Après-midi', 'Pomeriggio', 'Mediodía', 'Popołudnie', 'День', '下午'),
    evening: tr('Evening', 'Abend', 'Вечер', 'Noite', 'Avond', 'Soir', 'Sera', 'Noche', 'Wieczór', 'Вечір', '傍晚'),
    night: tr('Night', 'Nacht', 'Ночь', 'Madrugada', 'Nacht', 'Nuit', 'Notte', 'Madrugada', 'Noc', 'Ніч', '夜间'),
};

/** The word "Day", used to build the day folder labels. */
const DAY_WORD = tr('Day', 'Tag', 'День', 'Dia', 'Dag', 'Jour', 'Giorno', 'Día', 'Dzień', 'День', '天');

/** The word "Now", used as the prefix inside the `current` folder. */
const NOW_WORD = tr('Now', 'Jetzt', 'Сейчас', 'Agora', 'Nu', 'Maintenant', 'Adesso', 'Ahora', 'Teraz', 'Зараз', '当前');

/**
 * Looks a label up by its English wording.
 *
 * @param en English label, as written in the field tables.
 * @param fallbackDe German wording to use if the label is not in the table yet.
 * @returns Translation map covering all supported languages.
 */
export function label(en: string, fallbackDe?: string): Translated {
    const found = LABELS[en];
    if (found) {
        return { ...found };
    }
    // A label that has not been translated yet still has to produce a usable
    // name in every language rather than an incomplete one, so the English
    // wording stands in everywhere except German.
    return forEachLanguage((lang) => (lang === 'de' ? (fallbackDe ?? en) : en));
}

/**
 * Prefixes every language of a label with the matching language of another.
 *
 * @param prefix Prefix parts, already translated.
 * @param name The label itself.
 * @returns Combined translation map.
 */
export function prefixed(prefix: Translated, name: Translated): Translated {
    return forEachLanguage((lang) => {
        const head = prefix[lang];
        return head ? `${head}: ${name[lang]}` : name[lang];
    });
}

/**
 * Label of a day folder, e.g. "Day 0" / "Tag 0" / "第 0 天".
 *
 * @param index Day index, 0 = today.
 * @returns Translation map.
 */
export function dayLabel(index: number): Translated {
    return forEachLanguage((lang) => (lang === 'zh-cn' ? `第 ${index} 天` : `${DAY_WORD[lang]} ${index}`));
}

/**
 * Prefix for the states of a day, e.g. "Day 0".
 *
 * @param index Day index.
 * @returns Translation map.
 */
export function dayPrefix(index: number): Translated {
    return dayLabel(index);
}

/**
 * Prefix for the states of a day section, e.g. "Day 0 Morning".
 *
 * @param index Day index.
 * @param segment Segment id: morning, afternoon, evening or night.
 * @returns Translation map.
 */
export function daySegmentPrefix(index: number, segment: string): Translated {
    const day = dayLabel(index);
    const seg = SEGMENT_LABELS[segment] ?? label(segment);
    return forEachLanguage((lang) => `${day[lang]} ${seg[lang]}`);
}

/**
 * Prefix for the states of a single hour, e.g. "Day 0 07:00".
 *
 * @param index Day index.
 * @param hour Two digit hour label.
 * @returns Translation map.
 */
export function dayHourPrefix(index: number, hour: string): Translated {
    const day = dayLabel(index);
    return forEachLanguage((lang) => `${day[lang]} ${hour}:00`);
}

/**
 * Label of a day-section channel, e.g. "Morning".
 *
 * @param segment Segment id.
 * @returns Translation map.
 */
export function segmentLabel(segment: string): Translated {
    return { ...(SEGMENT_LABELS[segment] ?? label(segment)) };
}

/**
 * Label of an hour channel, e.g. "07:00".
 *
 * @param hour Two digit hour label.
 * @returns Translation map.
 */
export function hourLabel(hour: string): Translated {
    return forEachLanguage((lang) => (lang === 'de' ? `${hour}:00 Uhr` : `${hour}:00`));
}

/** Prefix used for every state inside the `current` folder. */
export const NOW_PREFIX: Translated = NOW_WORD;
