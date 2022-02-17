import { Service } from "typedi";
import {
  createResumeDTO,
  findResumeDTO,
  IResumeDAO,
  updateActivityDTO,
  updateAwardDTO,
  updateCareerDTO,
  updateEducationDTO,
  updateHelperVideoDTO,
  updateMyVideoDTO,
  updatePreferenceDTO,
  updatePreferenceJobDTO,
  updatePreferenceLocationDTO,
  updateResumeDTO,
  updateResumeInfoDTO,
} from "../types";
import { MySQL, queryTransactionWrapper } from "../utils";
import { findOneOrWhole, insert, update } from "../db";

const RESUME_TABLE = "resumes";
const RESUME_INFO_TABLE = "resume_infos";
const EDUCATION_TABLE = "educations";
const CAREER_TABLE = "careers";
const ACTIVITY_TABLE = "activities";
const AWARD_TABLE = "awards";
const MY_VIDEO_TABLE = "my_videos";
const HELPER_VIDEO_TABLE = "helper_videos";
const PREFERNCE_TABLE = "preferences";
const PREFERNCE_JOB_TABLE = "preference_jobs";
const PREFERNCE_LOCATION_TABLE = "preference_locations";
const USER_META_TABLE = "user_metas";

@Service()
export class ResumeDAO implements IResumeDAO {
  constructor(private readonly mysql: MySQL) {}

  async createResume(
    userId: number,
    {
      resume,
      resumeInfo,
      educations,
      careers,
      activities,
      awards,
      myVideo,
      helperVideo,
      preference: { preferenceJobs, preferenceLocations, ...preference },
    }: createResumeDTO
  ) {
    const pool = await this.mysql.getPool();

    const LAST_RESUME_ID = "@last_resume_id";
    const LAST_PREFERENCE_ID = "@last_preference_id";

    const resumeField = Object.keys(resume).concat("user_id");
    const resumeQuery = `INSERT INTO ${RESUME_TABLE} (${resumeField}) VALUES (?)`;

    const resumeQueryFunction = insert(
      {
        query: resumeQuery,
        values: [Object.values<any>(resume).concat(userId)],
      },
      pool
    );

    const setLastResumeIdQueryFunction = insert(
      {
        query: `SET ${LAST_RESUME_ID} = Last_insert_id();`,
      },
      pool
    );

    const resumeInfoFieldNames = Object.keys(resumeInfo).concat("resume_id");
    const resumeInfosQuery = `INSERT INTO ${RESUME_INFO_TABLE} (${resumeInfoFieldNames}) VALUES (?, ${LAST_RESUME_ID});`;
    const resumeValues = [Object.values<any>(resumeInfo)];

    const resumeInfoQueryFunction = insert(
      { query: resumeInfosQuery, values: resumeValues },
      pool
    );

    const educationQueryFunctions = educations.map((education) => {
      const educationFieldNames = Object.keys(education).concat("resume_id");
      const educationQuery = `INSERT INTO ${EDUCATION_TABLE} (${educationFieldNames}) VALUES (?, ${LAST_RESUME_ID});`;

      return insert(
        {
          query: educationQuery,
          values: [Object.values<any>(education)],
        },
        pool
      );
    });

    const carrerQueryFunctions = careers.map((career) => {
      const carrerFieldNames = Object.keys(career).concat("resume_id");
      const carrerQuery = `INSERT INTO ${CAREER_TABLE} (${carrerFieldNames}) VALUES (?, ${LAST_RESUME_ID})`;

      return insert(
        { query: carrerQuery, values: [Object.values(career)] },
        pool
      );
    });

    const activityQueryFunctions = activities.map((activity) => {
      const activityFieldNames = Object.keys(activity).concat("resume_id");
      const activityQuery = `INSERT INTO ${ACTIVITY_TABLE} (${activityFieldNames}) VALUES (?, ${LAST_RESUME_ID})`;

      return insert(
        {
          query: activityQuery,
          values: [Object.values(activity)],
        },
        pool
      );
    });

    const awardQueryFunctions = awards.map((award) => {
      const awardFieldNames = Object.keys(award).concat("resume_id");
      const awardQuery = `INSERT INTO ${AWARD_TABLE} (${awardFieldNames}) VALUES (?, ${LAST_RESUME_ID})`;

      return insert(
        { query: awardQuery, values: [Object.values(award)] },
        pool
      );
    });

    const myVideoFieldNames = Object.keys(myVideo).concat("resume_id");
    const myVideoQuery = `INSERT INTO ${MY_VIDEO_TABLE} (${myVideoFieldNames}) VALUES (?, ${LAST_RESUME_ID})`;
    const myVideoQueryFunction = insert(
      { query: myVideoQuery, values: [Object.values(myVideo)] },
      pool
    );

    const helperVideoFieldNames = Object.keys(helperVideo).concat("resume_id");
    const helperVideoQuery = `INSERT INTO ${HELPER_VIDEO_TABLE} (${helperVideoFieldNames}) VALUES (?, ${LAST_RESUME_ID})`;
    const helperVideoQueryFunction = insert(
      { query: helperVideoQuery, values: [Object.values(helperVideo)] },
      pool
    );

    const preferenceFieldNames = Object.keys(preference).concat("resume_id");
    const preferenceQuery = `INSERT INTO ${PREFERNCE_TABLE} (${preferenceFieldNames}) VALUES (?, ${LAST_RESUME_ID})`;
    const preferenceQueryFunction = insert(
      { query: preferenceQuery, values: [Object.values(preference)] },
      pool
    );

    const setLastPreferenceIdQueryFunction = insert(
      {
        query: `SET ${LAST_PREFERENCE_ID} = Last_insert_id();`,
      },
      pool
    );

    const preferenceJobQueryFunctions = preferenceJobs.map((preferenceJob) => {
      const preferenceJobFieldNames =
        Object.keys(preferenceJob).concat("preference_id");
      const preferenceJobQuery = `INSERT INTO ${PREFERNCE_JOB_TABLE} (${preferenceJobFieldNames}) VALUES (?, ${LAST_PREFERENCE_ID})`;
      return insert(
        { query: preferenceJobQuery, values: [Object.values(preferenceJob)] },
        pool
      );
    });

    const preferenceLocationQueryFunctions = preferenceLocations.map(
      (preferenceLocation) => {
        const preferenceLocationFieldNames =
          Object.keys(preferenceLocation).concat("preference_id");
        const preferenceLocationQuery = `INSERT INTO ${PREFERNCE_LOCATION_TABLE} (${preferenceLocationFieldNames}) VALUES (?, ${LAST_PREFERENCE_ID})`;
        return insert(
          {
            query: preferenceLocationQuery,
            values: [Object.values(preferenceLocation)],
          },
          pool
        );
      }
    );

    const updateUserMetaQueryFunction = insert(
      {
        query: `
        UPDATE ${USER_META_TABLE} AS m
        SET m.is_verified = IF( m.is_verified=0, 1, m.is_verified)
        WHERE m.user_id = ?;`,
        values: [userId],
      },
      pool
    );

    await queryTransactionWrapper(
      [
        resumeQueryFunction,
        setLastResumeIdQueryFunction,
        resumeInfoQueryFunction,
        ...educationQueryFunctions,
        ...carrerQueryFunctions,
        ...activityQueryFunctions,
        ...awardQueryFunctions,
        myVideoQueryFunction,
        helperVideoQueryFunction,
        preferenceQueryFunction,
        setLastPreferenceIdQueryFunction,
        ...preferenceJobQueryFunctions,
        ...preferenceLocationQueryFunctions,
        updateUserMetaQueryFunction,
      ],
      pool
    );
  }

  async findResumeById(resumeId: number): Promise<findResumeDTO> {
    const pool = await this.mysql.getPool();

    const subQuery1 = `
    SELECT resume_id, json_object('name', RI.name, 'birthday', RI.birthday, 'phone_number', RI.phone_number, 'email', RI.email, 'sido', RI.sido, 'sigungu', RI.sigungu, 'disability_level', RI.disability_level, 'disability_type', RI.disability_type, 'sex', RI.sex) AS resume_info
    FROM ${RESUME_INFO_TABLE} AS RI
    GROUP BY resume_id`;

    const subQuery2 = `
    SELECT resume_id, json_arrayagg(json_object('company', C.company, 'department', C.department)) AS careers
    FROM ${CAREER_TABLE} AS C
    GROUP BY resume_id`;

    const subQuery3 = `
    SELECT resume_id, json_arrayagg(json_object('type', E.type, 'school_name', E.school_name)) AS educations
    FROM ${EDUCATION_TABLE} AS E
    GROUP BY resume_id`;

    const subQuery4 = `
    SELECT resume_id, json_arrayagg(json_object('organization', A.organization, 'description', A.description)) AS activities
    FROM ${ACTIVITY_TABLE} AS A
    GROUP BY resume_id`;

    const subQuery5 = `
    SELECT resume_id, json_arrayagg(json_object('institute', W.institute, 'started_at', W.started_at)) AS awards
    FROM ${AWARD_TABLE} AS W
    GROUP BY resume_id`;

    const subQuery6 = `
    SELECT resume_id, json_object('url', MY.url) AS my_video
    FROM ${MY_VIDEO_TABLE} AS MY
    GROUP BY resume_id`;

    const subQuery7 = `
    SELECT resume_id, json_object('url', H.url) AS helper_video
    FROM ${HELPER_VIDEO_TABLE} AS H
    GROUP BY resume_id`;

    const subsubQuery1 = `
    SELECT preference_id, json_arrayagg(json_object('name', PJ.name)) AS preference_jobs
    FROM ${PREFERNCE_JOB_TABLE} AS PJ
    GROUP BY preference_id`;

    const subsubQuery2 = `
    SELECT preference_id, json_arrayagg(json_object('sido', PL.sido, 'sigungu', PL.sigungu)) AS preference_locations
    FROM ${PREFERNCE_LOCATION_TABLE} AS PL
    GROUP BY preference_id`;

    const subQuery8 = `
    SELECT id, resume_id, json_object('employ_type', P.employ_type, 'salary', P.salary, 'preference_jobs', pj.preference_jobs, 'preference_locations', pl.preference_locations) AS preference
    FROM ${PREFERNCE_TABLE} AS P
        JOIN (${subsubQuery1}) AS pj ON pj.preference_id = P.id
        JOIN (${subsubQuery2}) AS pl ON pl.preference_id = P.id
    GROUP BY resume_id`;

    const query = `
        SELECT
            R.title,
            R.content,
            ri.resume_info,
            e.educations,
            c.careers,
            a.activities,
            w.awards,
            my.my_video,
            h.helper_video,
            p.preference
        FROM ${RESUME_TABLE} AS R
        JOIN (${subQuery1}) AS ri ON ri.resume_id = R.id
        JOIN (${subQuery2}) AS c ON c.resume_id = R.id
        JOIN (${subQuery3}) AS e ON e.resume_id = R.id
        JOIN (${subQuery4}) AS a ON a.resume_id = R.id
        JOIN (${subQuery5}) AS w ON w.resume_id = R.id
        JOIN (${subQuery6}) AS my ON my.resume_id = R.id
        JOIN (${subQuery7}) AS h ON h.resume_id = R.id
        JOIN (${subQuery8}) AS p ON p.resume_id = R.id
        WHERE R.id = ?;
    `;
    const [rows] = await findOneOrWhole({ query, values: [resumeId] }, pool)();

    return rows[0] as findResumeDTO;
  }

  async updateResume(id: number, { resume }: updateResumeDTO) {
    const pool = await this.mysql.getPool();

    const query = `
        UPDATE ${RESUME_TABLE}
        SET ?
        WHERE id = ?
    `;
    await update({ query, values: [resume, id] }, pool)();
  }

  async updateResumeInfo(id: number, { resumeInfo }: updateResumeInfoDTO) {
    const pool = await this.mysql.getPool();

    const query = `
        UPDATE ${RESUME_INFO_TABLE}
        SET ?
        WHERE id = ?
    `;

    await update({ query, values: [resumeInfo, id] }, pool)();
  }

  async updateEducation(id: number, { education }: updateEducationDTO) {
    const pool = await this.mysql.getPool();

    const query = `
        UPDATE ${EDUCATION_TABLE}
        SET ?
        WHERE id = ? 
    `;
    await update({ query, values: [education, id] }, pool)();
  }

  async updateCareer(id: number, { career }: updateCareerDTO) {
    const pool = await this.mysql.getPool();

    const query = `
        UPDATE ${CAREER_TABLE}
        SET ?
        WHERE id = ? 
    `;
    await update({ query, values: [career, id] }, pool)();
  }

  async updateActivity(id: number, { activity }: updateActivityDTO) {
    const pool = await this.mysql.getPool();

    const query = `
        UPDATE ${ACTIVITY_TABLE}
        SET ?
        WHERE id = ? 
    `;
    await update({ query, values: [activity, id] }, pool)();
  }

  async updateAward(id: number, { award }: updateAwardDTO) {
    const pool = await this.mysql.getPool();

    const query = `
        UPDATE ${AWARD_TABLE}
        SET ?
        WHERE id = ? 
    `;
    await update({ query, values: [award, id] }, pool)();
  }

  async updateMyVideo(id: number, { myVideo }: updateMyVideoDTO) {
    const pool = await this.mysql.getPool();

    const query = `
        UPDATE ${MY_VIDEO_TABLE}
        SET ?
        WHERE id = ? 
    `;
    await update({ query, values: [myVideo, id] }, pool)();
  }

  async updateHelperVideo(id: number, { helperVideo }: updateHelperVideoDTO) {
    const pool = await this.mysql.getPool();

    const query = `
        UPDATE ${HELPER_VIDEO_TABLE}
        SET ?
        WHERE id = ? 
    `;
    await update({ query, values: [helperVideo, id] }, pool)();
  }

  async updatePreference(id: number, { preference }: updatePreferenceDTO) {
    const pool = await this.mysql.getPool();

    const query = `
        UPDATE ${PREFERNCE_TABLE}
        SET ?
        WHERE id = ? 
    `;
    await update({ query, values: [preference, id] }, pool)();
  }

  async updatePreferenceLocation(
    id: number,
    { preferenceLocation }: updatePreferenceLocationDTO
  ) {
    const pool = await this.mysql.getPool();

    const query = `
        UPDATE ${PREFERNCE_LOCATION_TABLE}
        SET ?
        WHERE id = ?
    `;
    await update(
      {
        query,
        values: [preferenceLocation, id],
      },
      pool
    )();
  }

  async updatePreferenceJob(
    id: number,
    { preferenceJob }: updatePreferenceJobDTO
  ) {
    const pool = await this.mysql.getPool();

    const query = `
        UPDATE ${PREFERNCE_JOB_TABLE}
        SET ?
        WHERE id = ?
    `;
    await update({ query, values: [preferenceJob, id] }, pool)();
  }

  async deleteResume(id: number) {
    const pool = await this.mysql.getPool();
    const query = `
        DELETE FROM ${RESUME_TABLE}
        WHERE id = ?
    `;

    await update({ query, values: [id] }, pool)();
  }

  async deleteResumeInfo(id: number) {
    const pool = await this.mysql.getPool();
    const query = `
        DELETE FROM ${RESUME_INFO_TABLE}
        WHERE id = ?
    `;

    await update({ query, values: [id] }, pool)();
  }

  async deleteEducation(id: number) {
    const pool = await this.mysql.getPool();
    const query = `
        DELETE FROM ${EDUCATION_TABLE}
        WHERE id = ?
    `;

    await update({ query, values: [id] }, pool)();
  }

  async deleteCareer(id: number) {
    const pool = await this.mysql.getPool();
    const query = `
        DELETE FROM ${CAREER_TABLE}
        WHERE id = ?
    `;

    await update({ query, values: [id] }, pool)();
  }

  async deleteActivity(id: number) {
    const pool = await this.mysql.getPool();
    const query = `
        DELETE FROM ${ACTIVITY_TABLE}
        WHERE id = ?
    `;

    await update({ query, values: [id] }, pool)();
  }

  async deleteAward(id: number) {
    const pool = await this.mysql.getPool();
    const query = `
        DELETE FROM ${AWARD_TABLE}
        WHERE id = ?
    `;

    await update({ query, values: [id] }, pool)();
  }

  async deleteMyVideo(id: number) {
    const pool = await this.mysql.getPool();
    const query = `
        DELETE FROM ${MY_VIDEO_TABLE}
        WHERE id = ?
    `;

    await update({ query, values: [id] }, pool)();
  }

  async deleteHelperVideo(id: number) {
    const pool = await this.mysql.getPool();
    const query = `
        DELETE FROM ${HELPER_VIDEO_TABLE}
        WHERE id = ?
    `;

    await update({ query, values: [id] }, pool)();
  }

  async deletePreference(id: number) {
    const pool = await this.mysql.getPool();
    const query = `
        DELETE FROM ${PREFERNCE_TABLE}
        WHERE id = ?
    `;

    await update({ query, values: [id] }, pool)();
  }

  async deletePreferenceJob(id: number) {
    const pool = await this.mysql.getPool();
    const query = `
        DELETE FROM ${PREFERNCE_JOB_TABLE}
        WHERE id = ?
    `;

    await update({ query, values: [id] }, pool)();
  }

  async deletePreferenceLocation(id: number) {
    const pool = await this.mysql.getPool();
    const query = `
        DELETE FROM ${PREFERNCE_LOCATION_TABLE}
        WHERE id = ?
    `;

    await update({ query, values: [id] }, pool)();
  }
}
