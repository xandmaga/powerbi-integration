import { FileSystem } from "../src/repositories/implementations/FileSystem";

describe('FileSystem - Error', () => {

    const fs = new FileSystem();

    it("Throw an Error if cannot write / read a file", async () => {
        
        const result = await fs.writeFile('../../lastRequestStatus.json', "teste").catch(err => {
            return err;
        });

        expect(result).toEqual(new Error('Error saving'));
    });
});