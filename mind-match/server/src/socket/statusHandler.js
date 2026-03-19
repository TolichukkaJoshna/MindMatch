import Status from '../models/Status.js';

export const setupStatusHandlers = (io, socket) => {
    // Subscribe to status updates
    socket.on('subscribe-status', () => {
        socket.join('status-feed');
        console.log(`User ${socket.userId} subscribed to status updates`);
    });

    // Unsubscribe from status updates
    socket.on('unsubscribe-status', () => {
        socket.leave('status-feed');
        console.log(`User ${socket.userId} unsubscribed from status updates`);
    });
};
