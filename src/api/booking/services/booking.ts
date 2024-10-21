/**
 * booking service
 */

import { factories, type Data } from '@strapi/strapi';

export default factories.createCoreService('api::booking.booking', ({ strapi }) => ({

    // Generate unique reference number
    generateReferenceNumber(): string {
        return Date.now().toString(36).toUpperCase();
    },

    // Calculate the base price of a booking
    calculatePrice(from: string, to: string, priceBase: number): number {
        const fromTime = new Date(from).getTime();
        const toTime = new Date(to).getTime();
        const duration = Math.ceil((toTime - fromTime) / (1000 * 60 * 60 * 24));
        return priceBase * duration;
    },

    // Calculate discounted price of a booking
    calculateFinalPrice(from: string, to: string, priceBase: number, discount: number = 0): number {
        const basePrice = this.calculatePrice(from, to, priceBase);
        const discountPercentage = (100 - (discount || 0)) / 100;
        return basePrice * discountPercentage;
    },


    // Validate the availability of a car within the following dates
    async validateAvailability(from: string, to: string, id: Data.DocumentID): Promise<boolean> {
        const car = await strapi.documents('api::car.car')
            .findOne({ documentId: id });
        const bookings = await strapi.documents('api::booking.booking')
            .findMany({
                filters: {
                    car: {
                        documentId: id
                    },
                    $or: [{
                        from: { $lte: from },
                        to: { $gte: from }
                    }, {
                        from: { $lte: to },
                        to: { $gte: to }
                    }],
                },
                populate: ['car']
            });

        return bookings.length < car.quantity;
    },

    // Link booking to car
    async linkBookingToCar(booking: Data.DocumentID, car: Data.DocumentID): Promise<unknown> {
        // Link booking to car
        return strapi.documents('api::car.car')
            .update({
                documentId: car,
                data: {
                    bookings: {
                        connect: [booking],
                    },
                },
                status: 'published',
            });
    },

    // Link booking to user
    async linkBookingToUser(booking: Data.DocumentID, user: Data.DocumentID): Promise<unknown> {
        return strapi.documents('plugin::users-permissions.user')
            .update({
                documentId: user,
                data: {
                    bookings: {
                        connect: [booking],
                    },
                },
                status: 'published',
            });
    },

}));
