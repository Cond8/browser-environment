// src/lib/cond8/scratch files/example-derived-director.js
import {
  CoreBlueprint,
  CoreRedprint,
  createDirector,
  createRole,
  StrictObjectKVService,
} from '../_core/index.js';

export const locate_user_from_ip_and_email = createDirector(
  'locate_user_from_ip_and_email',
  'Estimate user location using IP address and email metadata',
).init(input => ({
  conduit: new App_conduit(input),
}))(c8 => {
  const email_address = c8.body.email_address;
  const ip_address = c8.body.ip_address;
  c8.var('email_address', email_address);
  c8.var('ip_address', ip_address);
  return c8;
});

locate_user_from_ip_and_email(
  createRole(
    'extract_ip_from_email',
    'Extract IP address from the email headers if present',
    'PARSE',
  )(async c8 => {
    const email_address = c8.var('email_address');
    const result = await c8.email.parse_headers_for_ip(email_address);
    return c8.var('email_ip', result);
  }),
  createRole(
    'extract_ip_from_email',
    'Extract IP address from the email headers if present',
    'FETCH',
  )(async c8 => {
    const ip_address = c8.var('ip_address');
    const result = await c8.geo.fetch_location_by_ip(ip_address);
    return c8.var('geo_from_ip', result);
  }),
  createRole(
    'get_geo_from_email_ip',
    'Determine location using the IP extracted from email',
    'FETCH',
  )(async c8 => {
    const email_ip = c8.var('email_ip');
    const result = await c8.geo.fetch_location_by_ip(email_ip);
    return c8.var('geo_from_email_ip', result);
  }),
  createRole(
    'compare_ip_sources',
    'Compare direct IP and email-derived IP for consistency',
    'ANALYZE',
  )(async c8 => {
    const geo_from_ip = c8.var('geo_from_ip');
    const geo_from_email_ip = c8.var('geo_from_email_ip');
    const result = await c8.geo.locations(geo_from_ip, geo_from_email_ip);
    return c8.var('consistency_score', result);
  }),
  createRole(
    'choose_best_geo_location',
    'Pick the most likely accurate location',
    'SELECT',
  )(async c8 => {
    const geo_from_ip = c8.var('geo_from_ip');
    const geo_from_email_ip = c8.var('geo_from_email_ip');
    const consistency_score = c8.var('consistency_score');
    const result = await c8.geo.select_best_match(
      geo_from_ip,
      geo_from_email_ip,
      consistency_score,
    );
    return c8.var('best_location', result);
  }),
);

locate_user_from_ip_and_email.fin(c8 => c8.var('best_location'));

/** -------------------------
 * Conduit and Services
 * ------------------------*/

class App_conduit extends CoreRedprint {
  locals = new StrictObjectKVService('locals');
  email = new Email_service();
  geo = new Geo_service('geo');

  constructor(body) {
    super(body);
  }
}

class Email_service extends CoreBlueprint {
  constructor() {
    super('email');
  }
  parse_headers_for_ip(email_address) {}
}

class Geo_service extends CoreBlueprint {
  constructor() {
    super('geo');
  }
  fetch_location_by_ip(ip_address) {}
  locations(geo_from_ip, geo_from_email_ip) {}
  select_best_match(geo_from_ip, geo_from_email_ip, consistency_score) {}
}
