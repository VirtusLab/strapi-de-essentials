
export default  {
    routes: [
      {
        method: 'GET',
        path: '/bookings/utils/validate-availability',
        handler: 'api::booking.booking.validateAvailability',
        config: {
          auth: false,
        },
      },
    ],
  };