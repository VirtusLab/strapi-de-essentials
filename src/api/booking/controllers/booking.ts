/**
 * booking controller
 */

import { factories } from '@strapi/strapi';
import { errors } from '@strapi/utils';

export default factories.createCoreController('api::booking.booking', ({ strapi }) => ({
    // Validate the availability of a car within the following dates
    async validateAvailability(ctx) {
        const sanitizedQuery = await this.sanitizeQuery(ctx);
        const source = {
            ...(sanitizedQuery ?? {}),
            ...(ctx.request?.body?.data ?? {})
        };
        const { from, to, car } = source;

        try {
            return strapi.service('api::booking.booking')
                .validateAvailability(from, to, car);
        } catch (err) {
            throw new errors.NotFoundError('Not available');
        }
    },

    // Extend the create booking method
    async create(ctx, next) {

        try {
            // Validate availablity
            const isAvailable = await this.validateAvailability(ctx, next);

            if (isAvailable) {

                // Before creation generate reference number
                const refNumber = strapi.service('api::booking.booking')
                    .generateReferenceNumber();

                const { car, ...restBody } = ctx.request.body.data;

                const carModel = await strapi.documents('api::car.car')
                    .findOne({ documentId: car, fields: ['price_base'] });
                const bookingPrice = strapi.service('api::booking.booking')
                    .calculatePrice(restBody.from, restBody.to, carModel.price_base);


                const nextCtx = {
                    ...ctx,
                    query: {}, // Clean the query to avoid any conflict
                    request: {
                        ...ctx.request,
                        body: {
                            ...ctx.request.body,
                            data: {
                                ...restBody,
                                price_total: bookingPrice,
                                ref_number: refNumber,
                            }
                        },
                    },
                };

                // Call the native create booking method
                const { data } = await super.create(nextCtx);
                const { documentId } = data;

                // Link booking to car
                const bookedCar = await strapi.service('api::booking.booking')
                    .linkBookingToCar(documentId, car);

                // Link booking to user
                const customer = await strapi.service('api::booking.booking')
                    .linkBookingToUser(documentId, ctx.state.user.documentId);

                /**
                 * Could be used to send a confirmation email
                 * 
                const { ref_number } = data;

                try {
                    // Send a confirmation email
                    await strapi.plugins['email'].services.email.send({
                        to: ctx.state.user.email,
                        subject: `[#${ref_number}] Booking confirmation`,
                        text: `Your booking number #${ref_number} has been confirmed`
                    });
                } catch (err) {
                    console.error('Error sending email', err);
                }
                */

                return {
                    data: {
                        ...data,
                        car: bookedCar,
                        customer,
                    },
                };
            }
            throw new errors.NotFoundError(`Can't book the car`);
        } catch (err) {
            throw err;
        }
    },
}));