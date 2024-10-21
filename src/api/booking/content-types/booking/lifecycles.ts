
export default {
    // Recalculate total price when updating a booking
    async beforeUpdate(event) {
        const { data, where } = event.params;

        const currentBooking = await strapi.documents('api::booking.booking').findMany({
            filters: {
                id: where.id,
            },
            populate: {
                car: {
                    fields: ['price_base'],
                }
            },
        });

        const priceBase = currentBooking[0]?.car?.price_base;
        const finalPrice = strapi.service('api::booking.booking')
            .calculateFinalPrice(data.from, data.to, priceBase, data?.discount_applied);

        event.params.data.price_total = finalPrice;
    },
};