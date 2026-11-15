/*
     * Tageskarten: Ziehen ändert den Startzeitpunkt minutengenau.
     * Der Griff am unteren Rand ändert die Dauer in ganzen Minuten.
     *
     * Beide Eingaben verwenden denselben Minutenmaßstab wie die Zeichnung.
     */

    function getDayMinuteAtPosition(worldPoint, columnIndex) {
        const position = dayLaneGeometry(columnIndex);
        const firstHourY = position.top + 100;
        const minutesSinceMidnight = Math.round(
            (worldPoint.y - firstHourY) * 60 / 53.7
        );

        return minutesSinceMidnight;
    }

    function getDayColumnIndex(worldPoint) {
        const visibleMembers = orderedVisibleTeamMembers();
        if (dayStackMode) {
            for (let index = 0; index < visibleMembers.length; index++) {
                const position = dayLaneGeometry(index);
                const insideX = worldPoint.x >= position.left &&
                    worldPoint.x <= position.left + 370;
                if (insideX) {
                    return index;
                }
            }
            return null;
        }
        const columnIndex = Math.floor((worldPoint.x - 75) / 389);
        if (columnIndex < 0 || columnIndex >= visibleMembers.length) {
            return null;
        }
        return columnIndex;
    }

    function absoluteTimeAtDayMinute(minuteOfDay) {
        // Der Start des Tages ist ein absoluter UTC-Zeitpunkt.
        const startOfDay = new Date(convertLocalTimeToUtc(
            selectedDate.getFullYear(),
            selectedDate.getMonth() + 1,
            selectedDate.getDate(),
            0,
            0,
            homeTimeZone
        ));

        return new Date(startOfDay.getTime() + minuteOfDay * 60000);
    }

    function updateDayAppointmentDuringDrag(appointment, worldPoint, dragMode, start) {
        if (currentViewLevel !== 5) {
            return;
        }

        const columnIndex = getDayColumnIndex(worldPoint);
        if (columnIndex === null) {
            return;
        }

        const visibleMembers = orderedVisibleTeamMembers();
        const minuteOfDay = getDayMinuteAtPosition(worldPoint, columnIndex);
        const utcTime = absoluteTimeAtDayMinute(minuteOfDay);

        if (dragMode === 'resize') {
            const startTime = new Date(appointment.at).getTime();
            const minuteDuration = Math.round((utcTime.getTime() - startTime) / 60000);
            appointment.duration = Math.max(1, minuteDuration);
        } else {
            const originalStart = new Date(start.at).getTime();
            const originalMinute = Math.round(
                (originalStart - absoluteTimeAtDayMinute(0).getTime()) / 60000
            );
            const desiredMinute = minuteOfDay - start.grabOffsetMinutes;
            // Negative Minuten bedeuten Vortag; ab 1440 folgt der nächste Tag.
            // Dadurch lassen sich Termine über die Tagesgrenze ziehen.
            appointment.at = absoluteTimeAtDayMinute(desiredMinute).toISOString();
            appointment.owner = visibleMembers[columnIndex].id;
        }

        renderCurrentScene();
    }
