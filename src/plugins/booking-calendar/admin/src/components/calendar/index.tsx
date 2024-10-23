import { useState, useEffect } from "react"
import { Data, UID } from "@strapi/strapi";
import { Box, Flex, Typography } from '@strapi/design-system';

import { useIntl } from "react-intl";
import { Calendar, DateObject } from "react-multi-date-picker";
import { useLocation } from "react-router-dom";

import useApi from "../../hooks/useApi";
import { getTranslation } from "../../utils/getTranslation";

type ContentManagerType = 'single-types' | 'collection-types';

const CONTENT_MANAGER_PATH_PATTERN = /.*\/(?<type>[a-zA-Z-]+)\/(?<uid>[a-z0-9-_]+::[a-z0-9-_]+\.[a-z0-9-_]+)\/?(?<documentId>.{24})/;

type ContentManagerPathProps = {
    type: ContentManagerType;
    uid: UID.ContentType;
    documentId: Data.DocumentID;
};

const BookingCalendar = () => {
    const location = useLocation();
    const { formatMessage } = useIntl();
    const api = useApi();
    const [value, setValue] = useState([]);

    const groups: ContentManagerPathProps = new RegExp(CONTENT_MANAGER_PATH_PATTERN, "gm")
        .exec(location.pathname)?.groups as ContentManagerPathProps;

    const { uid, documentId } = groups ?? {};

    if (!documentId || !(uid === 'api::car.car')) {
        return null;
    }

    useEffect(() => {
        const fetchAPI = async (id: string) => {
            const bookings = await api.getBookingsByCar(id);
            const ranges = bookings?.data?.results?.map((booking: any) => {
                // Mapping the bookings to ranges
                const from = new DateObject(booking.from);
                const to = new DateObject(booking.to);

                return [from, to];
            }).reduce((acc: Array<Array<DateObject>>, curr: Array<DateObject>) => {
                // Join the ranges which got return and next take in a same day
                const prev = acc.length ? acc[acc.length - 1] : null;
                if (prev && (prev[1].day === curr[0].day)) {
                    acc.pop();

                    return [...(acc ?? []), [prev[0], curr[1]]];
                }

                return [...(acc ?? []), curr];
            }, []);

            setValue(ranges);
        };

        if (documentId) {
            fetchAPI(documentId);
        }
    }, [documentId]);

    return (<Box width="100%" marginTop={2}>
        <Flex gap={2} direction="column" alignItems="flex-start">
            <Typography as="h2" variant="sigma">{formatMessage({
                id: getTranslation('injection.content-manager.booking-calendar.header')
            })}</Typography>
            <Flex width="100%" direction="column" alignItems="center" justifyContent="center">
                <Calendar
                    value={value}
                    shadow={false}
                    highlightToday={false}
                    numberOfMonths={1}
                    weekStartDayIndex={1}
                    showOtherDays
                    readOnly
                    multiple
                    range />
            </Flex>
        </Flex>
    </Box>);
};

export default BookingCalendar;