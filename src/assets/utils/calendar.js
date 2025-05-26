function generateCalendarLinks({ title, description, location, startDate, endDate }) {
    const safeDate = (input) => {
        const date = new Date(input);
        if (isNaN(date.getTime())) throw new Error(`Invalid date: ${input}`);
        return date;
    };

    const formatDate = (timestamp) => {
        const date = safeDate(timestamp);
        return encodeURIComponent(date.toISOString().replace(/-|:|\.\d\d\d/g, ''));
    };

    const truncate = (text, max = 150) =>
        encodeURIComponent(text?.toString().slice(0, max) || '');

    const start = formatDate(startDate);
    const end = formatDate(endDate);

    const encodedTitle = truncate(title, 100);
    const encodedDesc = truncate(description, 150); // <= adapt if needed
    const encodedLocation = truncate(location, 100);

    const googleLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${start}/${end}&details=${encodedDesc}&sf=true&output=xml`;

    const outlookLink = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodedTitle}&body=${encodedDesc}&startdt=${startDate}&enddt=${endDate}`;

    const yahooLink = `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodedTitle}&st=${start}&et=${end}&desc=${encodedDesc}`;

    // .ics content for Apple/Samsung/others
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\n');

    const icsBlob = new Blob([icsContent], { type: 'text/calendar' });
    const icsUrl = URL.createObjectURL(icsBlob);

    return {
        google: googleLink,
        outlook: outlookLink,
        yahoo: yahooLink,
        ics: icsUrl
    };
}

module.exports = { generateCalendarLinks };
