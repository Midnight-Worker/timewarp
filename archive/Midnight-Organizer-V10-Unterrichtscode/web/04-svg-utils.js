/*
 * 04-svg-utils.js – kleine, wiederverwendbare Zeichenfunktionen.
 *
 * Ein SVG-Element ist ein normales DOM-Element. Wir erstellen es
 * mit createElementNS(), setzen Attribute und hängen es an die Welt.
 */

function createSvgElement(tagName, attributes = {}, parentElement = world) {
    const element = document.createElementNS(svgNamespace, tagName);

    for (const [attributeName, attributeValue] of Object.entries(attributes)) {
        element.setAttribute(attributeName, attributeValue);
    }

    parentElement.appendChild(element);
    return element;
}

function drawSvgRectangle(
    parentElement,
    x,
    y,
    width,
    height,
    fillColor,
    strokeColor = 'none',
    extraAttributes = {}
) {
    return createSvgElement('rect', {
        x: x,
        y: y,
        width: width,
        height: height,
        rx: 8,
        fill: fillColor,
        stroke: strokeColor,
        ...extraAttributes
    }, parentElement);
}

function drawSvgText(
    parentElement,
    x,
    y,
    content,
    fontSize = 18,
    textColor = '#d8f6ff',
    fontWeight = 500,
    extraAttributes = {}
) {
    const textElement = createSvgElement('text', {
        x: x,
        y: y,
        fill: textColor,
        'font-size': fontSize,
        'font-family': 'system-ui, Segoe UI, sans-serif',
        'font-weight': fontWeight,
        ...extraAttributes
    }, parentElement);

    textElement.textContent = content;
    return textElement;
}

function findTeamMember(memberId) {
    return teamMembers.find(member => member.id === memberId) || teamMembers[0];
}

function appointmentsForDate(dateString, memberId = null) {
    return appointments.filter(appointment => {
        const appointmentDay = dateStringInTimeZone(
            appointmentUtcDate(appointment),
            homeTimeZone
        );

        const dateMatches = appointmentDay === dateString;
        const memberMatches = !memberId || appointment.owner === memberId;
        return dateMatches && memberMatches;
    });
}

function renderAppointmentCard(
    parentElement,
    appointment,
    x,
    y,
    width,
    height,
    compact = false
) {
    const member = findTeamMember(appointment.owner);
    const accentColor = member.color;

    const cardGroup = createSvgElement('g', {
        'data-card': appointment.id,
        style: 'cursor:grab'
    }, parentElement);

    drawSvgRectangle(cardGroup, x, y, width, height, accentColor, accentColor, {
        'fill-opacity': compact ? 0.48 : 0.17,
        'stroke-width': compact ? 0 : 2
    });

    drawSvgRectangle(cardGroup, x, y, 5, height, accentColor);

    if (!compact) {
        const maximumTitleLength = Math.max(6, Math.floor(width / 10));
        const visibleTitle = appointment.title.slice(0, maximumTitleLength);
        const titleY = y + Math.min(24, height - 9);
        const titleFontSize = Math.min(17, height * 0.38);

        drawSvgText(
            cardGroup, x + 13, titleY, visibleTitle,
            titleFontSize, '#f5ffff', 650
        );

        if (height > 55) {
            drawSvgText(
                cardGroup, x + 13, y + 49,
                member.name, 12, '#c3d7e5'
            );
        }
    }

    return cardGroup;
}
