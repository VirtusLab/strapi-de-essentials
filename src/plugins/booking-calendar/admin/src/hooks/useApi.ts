import { useFetchClient } from '@strapi/strapi/admin';
import qs from 'qs';

const useApi = () => {
    const fetchClient = useFetchClient();

    const getBookingsByCar = async (id: string, locale?: string) => {
        const relationsQuery = qs.stringify({
            fields: ['from', 'to'],
            locale: locale ?? 'en',
            pageSize: 100,
        }, {
            encodeValuesOnly: true,
        });

        const relations = await fetchClient.get(`/content-manager/relations/api::car.car/${id}/bookings?${relationsQuery}`);
        const bookingsIds = relations.data.results.map((relation: any) => relation.id);

        const bookingsQuery = qs.stringify({
            filters: {
                id: {
                    $in: bookingsIds
                }
            },
            fields: ['from', 'to'],
            sort: 'from:asc',
        }, {
            encodeValuesOnly: true,
        });

        return fetchClient.get(`/content-manager/collection-types/api::booking.booking?${bookingsQuery}`);
    };

    return { getBookingsByCar }
};
export default useApi;